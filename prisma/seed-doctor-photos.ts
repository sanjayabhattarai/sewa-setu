/**
 * seed-doctor-photos.ts
 *
 * Scans every department folder inside /public, matches each photo to a
 * Doctor in the DB by checking if the filename (underscores → spaces)
 * starts with a known doctor fullName — no fragile suffix parsing needed.
 *
 * Run:
 *   npx tsx prisma/seed-doctor-photos.ts
 */

import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

/**
 * Normalise a string for comparison:
 *   - remove dots (Dr. → Dr)
 *   - remove parenthesised parts e.g. "Shah (Thapa)" → "Shah"
 *   - underscores / multiple spaces → single space
 *   - lowercase + trim
 */
function normalise(s: string): string {
  return s
    .replace(/\([^)]*\)/g, "")   // strip (Thapa) etc.
    .replace(/\./g, "")           // Dr. → Dr
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Given a normalised filename base and a list of normalised doctor names,
 * return the best (longest) match whose normalised name is a prefix of the
 * filename base (followed by a space or end-of-string).
 *
 * e.g. filename  = "dr anu subedi dermatology  std"
 *      names     = ["dr anu subedi", "dr a subedi", ...]
 *      → "dr anu subedi"
 */
function findBestMatch(
  normBase: string,
  doctors: { id: string; fullName: string; normName: string }[]
): { id: string; fullName: string } | null {
  let best: { id: string; fullName: string } | null = null;
  let bestLen = 0;

  for (const doc of doctors) {
    const n = doc.normName;
    if (normBase === n || normBase.startsWith(n + " ")) {
      if (n.length > bestLen) {
        bestLen = n.length;
        best = doc;
      }
    }
  }
  return best;
}

/**
 * Build a "proper" display name from a filename base + the folder name.
 * Steps:
 *  1. Normalise both strings (underscores → spaces, no dots, lowercase)
 *  2. Strip the department suffix from the end of the normalised base
 *  3. Title-case the result, adding dots after known title abbreviations
 *
 * e.g. baseName   = "Cl_PSY_Jug_Maya_Chaudhary_Psychiatry"
 *      folderName = "Psychiatry"
 *      → "Cl. PSY Jug Maya Chaudhary"
 */
function buildProperName(baseName: string, folderName: string): string {
  const normBase = normalise(baseName);
  const normFolder = normalise(folderName);

  let namePart = normBase;
  // Strip folder suffix if present
  if (normBase.endsWith(" " + normFolder)) {
    namePart = normBase.slice(0, normBase.length - normFolder.length - 1).trim();
  }

  // Title-case each word, then patch known abbreviations
  const titled = namePart
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return titled
    .replace(/\bDr\b/g, "Dr.")
    .replace(/\bProf\b/g, "Prof.")
    .replace(/\bAsst\b/g, "Asst.")
    .replace(/\bAssoc\b/g, "Assoc.")
    .replace(/\bAud\b/g, "Aud.")
    .replace(/\bDs\b/g, "Ds.")
    .replace(/\bCl\b/g, "Cl.")
    .replace(/\bPsy\b/g, "PSY");
}

async function main() {
  const publicDir = path.join(process.cwd(), "public");

  // Load all doctors once
  const allDoctors = await prisma.doctor.findMany({
    select: { id: true, fullName: true },
  });
  const doctorIndex = allDoctors.map((d) => ({
    ...d,
    normName: normalise(d.fullName),
  }));

  const entries = fs.readdirSync(publicDir, { withFileTypes: true });
  const deptFolders = entries.filter((e) => e.isDirectory());

  let assigned = 0;
  let skipped = 0;
  const notFound: string[] = [];

  for (const dept of deptFolders) {
    const folderName = dept.name;
    const folderPath = path.join(publicDir, folderName);

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

    for (const file of files) {
      const baseName = path.parse(file).name;
      const normBase = normalise(baseName);

      let match = findBestMatch(normBase, doctorIndex);

      if (!match) {
        // Auto-create the doctor from the filename
        const properName = buildProperName(baseName, folderName);
        const newDoctor = await prisma.doctor.create({
          data: { fullName: properName, verified: false },
        });
        // Add to in-memory index so duplicates within the same run are caught
        doctorIndex.push({ id: newDoctor.id, fullName: properName, normName: normalise(properName) });
        match = { id: newDoctor.id, fullName: properName };
        console.log(`🆕 Created doctor : ${properName}`);
      }

      // URL — Next.js serves /public at root; encode spaces in path segments
      const url = `/${encodeURIComponent(folderName)}/${encodeURIComponent(file)}`;

      // Avoid duplicates
      const existing = await prisma.doctorMedia.findFirst({
        where: { doctorId: match.id, url },
      });
      if (existing) {
        console.log(`⏭  Already set : ${match.fullName}`);
        skipped++;
        continue;
      }

      const existingCount = await prisma.doctorMedia.count({
        where: { doctorId: match.id },
      });

      await prisma.doctorMedia.create({
        data: {
          doctorId: match.id,
          url,
          altText: match.fullName,
          isPrimary: existingCount === 0,
        },
      });

      console.log(`✅ Assigned : ${match.fullName}`);
      assigned++;
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅  Photos assigned : ${assigned}`);
  console.log(`⏭   Already existed : ${skipped}`);

  if (notFound.length) {
    console.log(`\n⚠️  No DB match for ${notFound.length} photo(s):`);
    notFound.forEach((n) => console.log("   -", n));
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

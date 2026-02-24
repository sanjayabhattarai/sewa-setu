/**
 * Prisma seed script — Charak Memorial Hospital (CMH)
 * Source JSON: prisma/charak_hospital/cmh_import_playwright_clean.json
 *
 * Run:  npx tsx prisma/seed-cmh.ts
 * Safe to re-run (upsert everywhere). Does NOT touch Grande Hospital data.
 */

import { PrismaClient, HospitalType, ConsultationMode } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

// ── Availability helpers (same logic as seed-availability.ts) ─────────────
const pad2 = (n: number) => String(n).padStart(2, "0");
const toTime = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
function hashStr(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function rng(seed: number) {
  let x = seed || 123456789;
  return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x >>>= 0; x ^= x << 5; x >>>= 0; return x / 0xffffffff; };
}
const ALL_WORKING_DAYS = [0, 1, 2, 3, 4, 5];
const DAYTIME_PATTERNS = [["08:00","10:00","12:00","14:00"],["09:00","11:00","13:00","15:00"],["10:00","12:00","14:00","16:00"]];
const ONLINE_POOL = ["17:00","18:00","19:00","20:00","21:00"];
function buildDailySlots(r: () => number) {
  const base = DAYTIME_PATTERNS[Math.floor(r() * DAYTIME_PATTERNS.length)];
  const physicalTimes = base.slice(0, 1 + Math.floor(r() * 3));
  return { physicalTimes, onlineTime: ONLINE_POOL[Math.floor(r() * ONLINE_POOL.length)] };
}

// ── Slug → proper display name (JSON has "Department" for all names) ──────────
const DEPT_NAMES: Record<string, string> = {
  "internal-medicine":                                   "Internal Medicine",
  "interventional-cardiology":                           "Interventional Cardiology",
  "anaesthesiology":                                     "Critical Care Medicine & Anaesthesiology",
  "endocrinology-and-metabolism":                        "Endocrinology and Metabolism",
  "nephrology":                                          "Nephrology",
  "general-surgery":                                     "General and Laparoscopic Surgery",
  "urology-and-uro-surgery":                             "Urology and Uro-surgery",
  "obstetrics-and-gynecology":                           "Obstetrics and Gynecology",
  "trauma-and-orthopedics":                              "Trauma and Orthopedics",
  "neurosurgery":                                        "Neurosurgery",
  "plastic-reconstructive-surgery":                      "Plastic & Reconstructive Surgery",
  "pediatrics":                                          "Pediatrics",
  "ophthalmology":                                       "Ophthalmology",
  "ear-nose-and-throat-ent":                             "Otorhinolaryngology (ENT)",
  "dermatology-cosmetology-and-hair-transplant-center":  "Dermatology, Cosmetology And Hair Transplant",
  "radiology":                                           "Radiology",
  "oncology":                                            "Oncology",
  "psychiatry-psychology":                               "Psychiatry & Psychology",
  "dental-and-oral-care":                                "Dental and Oral Care",
  "physiotherapy":                                       "Physiotherapy",
  "pulmonology-and-sleep":                               "Pulmonology & Sleep",
  "dietetics-nutrition":                                 "Dietetics & Nutrition",
};

// Specialty text that leaked in from other sections — treat as null
const SPECIALTY_NOISE = [
  "Awards And Achievements",
  "Professional Memberships",
  "NMC",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function clean(s?: string | null): string | null {
  if (!s) return null;
  const t = String(s).trim();
  return t.length ? t : null;
}

/** education field is an array in the JSON — join to "DM, MD" */
function parseEducation(edu: unknown): string | null {
  if (!edu) return null;
  if (Array.isArray(edu)) {
    const joined = edu.map((e) => String(e).trim()).filter(Boolean).join(", ");
    return joined || null;
  }
  return clean(String(edu));
}

/** Strip specialty values that are actually Awards/Memberships noise */
function parseSpecialty(spec: unknown): string | null {
  if (!spec) return null;
  const s = clean(String(spec));
  if (!s) return null;
  if (SPECIALTY_NOISE.some((n) => s.includes(n))) return null;
  return s;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawDoctor {
  fullName?: string | null;
  education?: string[] | string | null;
  specialty?: string | null;
  about?: string | null;
  imageUrl?: string | null;
}

interface RawDepartment {
  name: string;
  slug: string;
  overview?: string | null;
  doctors?: RawDoctor[];
}

interface RawJson {
  departments: RawDepartment[];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 CMH seed starting...");

  const jsonPath = path.join(
    process.cwd(),
    "prisma",
    "charak_hospital",
    "cmh_import_playwright_clean.json"
  );

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`JSON not found: ${jsonPath}`);
  }

  const raw: RawJson = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`📂 Loaded ${raw.departments.length} departments`);

  // ── Location ──────────────────────────────────────────────────────────────
  const location = await prisma.location.upsert({
    where: { id: "cmh-location-pokhara" },
    update: {},
    create: {
      id: "cmh-location-pokhara",
      country: "Nepal",
      province: "Gandaki Province",
      district: "Kaski",
      city: "Pokhara",
      area: "Nagdhunga",
      addressLine: "Nagdhunga, Pokhara-8, Kaski",
    },
  });

  // ── Hospital ──────────────────────────────────────────────────────────────
  const SUMMARY =
    "CHARAK MEMORIAL HOSPITAL PVT. LTD. (CMH) was founded with the principles of Social equity in health care. " +
    "CMH is registered and established on 10th of Mangsir 2069 and is thriving to provide health services in hygienic way " +
    "as well as modernization in its system. The Hospital is located presently in a centre of Pokhara, best suited for providing prompt health services. " +
    "The hospital was originated by the combined sincere efforts of Doctors and few dedicated people working in health sector. " +
    "Over the course of this exciting journey we have the central mission of providing quality health care services mainly the rural and disadvantaged people " +
    "surrounding near the Gandaki and Dhaulagiri zone with the utmost professionalism. " +
    "Despite all the challenges CMH become one of the fastest growing hospital in the western region also managed to expand its services to the academics programs in the near future. " +
    "Charak Memorial Hospital is a multi-specialty hospital, cares for over a 2 million population in the Gandaki Province. " +
    "Its mission is to offer state-of-the-art diagnostic, curative and rehabilitative services of international standards with evidence-based ethical healthcare.";

  const hospital = await prisma.hospital.upsert({
    where: { slug: "charak-memorial-hospital" },
    update: { servicesSummary: SUMMARY },
    create: {
      slug: "charak-memorial-hospital",
      name: "Charak Memorial Hospital",
      type: HospitalType.HOSPITAL,
      locationId: location.id,
      phone: "+977 61 582779",
      website: "https://cmh.com.np",
      emergencyAvailable: true,
      verified: true,
      servicesSummary: SUMMARY,
    },
  });

  console.log(`🏥 Hospital ready: ${hospital.name}`);

  // ── Departments + Doctors ─────────────────────────────────────────────────
  const doctorIdByName = new Map<string, string>();
  let deptCount = 0;
  let doctorCount = 0;

  for (const [dIdx, dept] of raw.departments.entries()) {
    const deptSlug = dept.slug;
    // Use the lookup map — JSON has "Department" for almost all names
    const deptName = DEPT_NAMES[deptSlug] ?? dept.name;

    console.log(`\n[${dIdx + 1}/${raw.departments.length}] ${deptName}`);

    // Specialty record (one per department)
    const specialty = await prisma.specialty.upsert({
      where: { slug: deptSlug },
      update: {},
      create: { name: deptName, slug: deptSlug },
    });

    // HospitalDepartment
    const hospitalDept = await prisma.hospitalDepartment.upsert({
      where: { hospitalId_slug: { hospitalId: hospital.id, slug: deptSlug } },
      update: { overview: clean(dept.overview) },
      create: {
        hospitalId: hospital.id,
        specialtyId: specialty.id,
        name: deptName,
        slug: deptSlug,
        overview: clean(dept.overview),
        dataOrigin: "IMPORTED",
        sortOrder: dIdx,
      },
    });

    deptCount++;

    let sortOrder = 0;

    for (const doc of dept.doctors ?? []) {
      const fullName = clean(doc.fullName);
      if (!fullName) continue;

      const education = parseEducation(doc.education);
      // If specialty is noise/null, fall back to the department name
      const specialty_str = parseSpecialty(doc.specialty) ?? deptName;
      const bio = clean(doc.about);

      // ── Create or reuse Doctor ───────────────────────────────────────────
      let doctorId = doctorIdByName.get(fullName);

      if (!doctorId) {
        const existing = await prisma.doctor.findFirst({
          where: { fullName },
          select: { id: true },
        });

        if (existing) {
          doctorId = existing.id;
        } else {
          const created = await prisma.doctor.create({
            data: { fullName, education, bio, verified: false },
          });
          doctorId = created.id;
          doctorCount++;
        }

        doctorIdByName.set(fullName, doctorId);
      }

      // ── DoctorHospital link ──────────────────────────────────────────────
      await prisma.doctorHospital.upsert({
        where: { doctorId_hospitalId: { doctorId, hospitalId: hospital.id } },
        update: { positionTitle: specialty_str },
        create: {
          doctorId,
          hospitalId: hospital.id,
          positionTitle: specialty_str,
          isPrimary: true,
        },
      });

      // ── DoctorSpecialty ──────────────────────────────────────────────────
      if (specialty_str) {
        const spSlug = slugify(specialty_str);
        const sp = await prisma.specialty.upsert({
          where: { slug: spSlug },
          update: {},
          create: { name: specialty_str, slug: spSlug },
        });
        await prisma.doctorSpecialty.upsert({
          where: { doctorId_specialtyId: { doctorId, specialtyId: sp.id } },
          update: {},
          create: { doctorId, specialtyId: sp.id, isPrimary: true },
        });
      }

      // ── DepartmentDoctor link ────────────────────────────────────────────
      await prisma.departmentDoctor.upsert({
        where: { departmentId_doctorId: { departmentId: hospitalDept.id, doctorId } },
        update: { designation: specialty_str, education },
        create: {
          departmentId: hospitalDept.id,
          doctorId,
          designation: specialty_str,
          education,
          sortOrder,
        },
      });

      process.stdout.write(`  ✓ ${fullName} | ${education ?? "—"} | ${specialty_str ?? "—"}\n`);
      sortOrder++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅  CMH seed complete`);
  console.log(`🏢  Departments : ${deptCount}`);
  console.log(`👤  Doctors     : ${doctorCount}`);

  // ── CMH Health Packages ───────────────────────────────────────────────────
  const cmhPackages = [
    {
      title: "Basic Wellness Checkup",
      price: 1500,
      description: `Consultations
- General Physician Consultation

Pathology & Labs
- Complete Blood Count (CBC)
- Fasting Blood Sugar (FBG)
- Lipid Profile
- Serum Creatinine & Blood Urea
- SGOT / SGPT
- Urine Routine

Imaging & Diagnostics
- Chest X-Ray
- Resting ECG`,
    },
    {
      title: "Comprehensive Executive Checkup",
      price: 3000,
      description: `Consultations
- General Physician Consultation
- Dietician Consultation

Pathology & Labs
- CBC, FBG, HbA1c
- Lipid Profile
- Thyroid Function (TSH, TFT)
- Vitamin D & B12
- Liver & Kidney Function Tests
- Urine Routine

Imaging & Diagnostics
- Chest X-Ray, ECG
- Ultrasound Abdomen & Pelvis
- Echocardiogram (ECHO)`,
    },
    {
      title: "Women's Wellness Package",
      price: 2500,
      description: `Consultations
- Gynecologist Consultation
- Dietician Consultation

Pathology & Labs
- CBC, FBG, TSH
- Liver & Kidney Function Tests
- Urine Routine

Imaging & Diagnostics
- Ultrasound Abdomen & Pelvis
- Breast Ultrasound

Specialized Tests
- Pap Smear (Cervical cancer screening)`,
    },
    {
      title: "Cardiac & Diabetes Care",
      price: 2200,
      description: `Consultations
- Cardiologist Consultation
- Dietician Consultation

Pathology & Labs
- CBC, FBG, PPG, HbA1c
- Lipid Profile
- Kidney Function Tests
- Urine Microalbumin

Imaging & Diagnostics
- Resting ECG
- Echocardiogram (ECHO)
- Treadmill Test (TMT)`,
    },
  ];

  // Wipe existing seeded packages for CMH then re-create
  await prisma.hospitalPackage.deleteMany({
    where: { hospitalId: hospital.id, dataOrigin: "SEEDED" },
  });
  await prisma.hospitalPackage.createMany({
    data: cmhPackages.map((p) => ({
      hospitalId: hospital.id,
      title: p.title,
      description: p.description,
      price: p.price,
      currency: "eur",
      isActive: true,
      dataOrigin: "SEEDED",
    })),
  });
  console.log(`📦  Packages    : ${cmhPackages.length}`);
  console.log("=".repeat(50));

  // ── Availability Slots ────────────────────────────────────────────────────
  // Wipe existing slots for CMH only, then re-seed
  await prisma.availabilitySlot.deleteMany({ where: { hospitalId: hospital.id } });

  const cmhDoctors = await prisma.doctor.findMany({
    where: { hospitals: { some: { hospitalId: hospital.id } } },
    select: { id: true },
  });

  type SlotRow = { doctorId: string; hospitalId: string; mode: ConsultationMode; dayOfWeek: number; startTime: string; endTime: string; slotDurationMinutes: number; isActive: boolean };
  const rows: SlotRow[] = [];

  for (const d of cmhDoctors) {
    const r = rng(hashStr(d.id));
    for (const dayOfWeek of ALL_WORKING_DAYS) {
      const { physicalTimes, onlineTime } = buildDailySlots(r);
      for (const t of physicalTimes) {
        const st = toMin(t);
        rows.push({ doctorId: d.id, hospitalId: hospital.id, mode: ConsultationMode.PHYSICAL, dayOfWeek, startTime: toTime(st), endTime: toTime(st + 30), slotDurationMinutes: 30, isActive: true });
      }
      const ost = toMin(onlineTime);
      rows.push({ doctorId: d.id, hospitalId: hospital.id, mode: ConsultationMode.ONLINE, dayOfWeek, startTime: toTime(ost), endTime: toTime(ost + 30), slotDurationMinutes: 30, isActive: true });
    }
  }

  const avail = await prisma.availabilitySlot.createMany({ data: rows, skipDuplicates: true });
  console.log(`📅  Slots       : ${avail.count} (${cmhDoctors.length} doctors)`);
  console.log("=".repeat(50));

  // ── Doctor Fees ───────────────────────────────────────────────────────────
  const EUR_FEES_CENTS = [500, 600, 700, 800, 900, 1000];
  const feeUpdates = cmhDoctors.map((d) => {
    const feeMin = EUR_FEES_CENTS[Math.floor(Math.random() * EUR_FEES_CENTS.length)];
    return prisma.doctor.update({ where: { id: d.id }, data: { feeMin, feeMax: null, currency: "eur" } });
  });
  const CHUNK = 100;
  for (let i = 0; i < feeUpdates.length; i += CHUNK) {
    await prisma.$transaction(feeUpdates.slice(i, i + CHUNK));
  }
  console.log(`💶  Fees        : updated for ${cmhDoctors.length} doctors (€5–€10)`);
  console.log("=".repeat(50));

  // ── Hospital Photo ────────────────────────────────────────────────────────
  await prisma.hospitalMedia.deleteMany({ where: { hospitalId: hospital.id } });
  await prisma.hospitalMedia.create({
    data: {
      hospitalId: hospital.id,
      url: "/CharakHospital.webp",
      altText: "Charak Memorial Hospital, Pokhara",
      isPrimary: true,
    },
  });
  console.log(`🖼️   Photo       : /CharakHospital.webp`);
  console.log("=".repeat(50));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

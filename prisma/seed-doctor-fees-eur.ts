// prisma/seed-doctor-fees.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Fees are stored as cents for Stripe compatibility.
 * Allowed values (EUR): 5,6,7,8,9,10  -> stored as 500..1000
 */
const EUR_FEES_CENTS = [500, 600, 700, 800, 900, 1000] as const;

// Set this true to overwrite any existing fees. False = only fill missing.
const OVERWRITE_EXISTING = true;

// If you want ONLY 5 or 10 (not 6/7/8/9), set to true.
const ONLY_FIVE_OR_TEN = false;

function pickFeeCents() {
  if (ONLY_FIVE_OR_TEN) {
    return Math.random() < 0.5 ? 500 : 1000;
  }
  return EUR_FEES_CENTS[Math.floor(Math.random() * EUR_FEES_CENTS.length)];
}

async function main() {
  console.log("💶 Seeding doctor fees (EUR, no decimals)...");

  const doctors = await prisma.doctor.findMany({
    where: OVERWRITE_EXISTING ? {} : { feeMin: null },
    select: { id: true },
  });

  console.log(`👨‍⚕️ Doctors to update: ${doctors.length}`);

  // Faster than updating one-by-one: do it in a transaction batch
  const updates = doctors.map((d) => {
    const feeMin = pickFeeCents(); // 500..1000
    return prisma.doctor.update({
      where: { id: d.id },
      data: {
        feeMin,
        feeMax: null,      // keep simple for now
        currency: "eur",   // store lowercase
      },
    });
  });

  // Run updates in chunks to avoid huge transactions
  const CHUNK = 200;
  for (let i = 0; i < updates.length; i += CHUNK) {
    await prisma.$transaction(updates.slice(i, i + CHUNK));
    console.log(`✅ Updated ${Math.min(i + CHUNK, updates.length)} / ${updates.length}`);
  }

  console.log("🎉 Done seeding doctor fees.");
}

main()
  .catch((e) => {
    console.error("❌ Fee seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
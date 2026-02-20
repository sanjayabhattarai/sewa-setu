import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Removing all doctor fees...");

  const result = await prisma.doctor.updateMany({
    data: {
      feeMin: null,
      feeMax: null,
      currency: null,
    },
  });

  console.log(`✅ Cleared fees for ${result.count} doctors.`);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const hospital = await prisma.hospital.findUnique({
    where: { slug: "grande-international-hospital" },
    include: { media: true },
  });

  if (!hospital) {
    console.error("❌ Hospital not found. Check the slug.");
    return;
  }

  // Mark any existing primary as non-primary
  if (hospital.media.length > 0) {
    await prisma.hospitalMedia.updateMany({
      where: { hospitalId: hospital.id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  // Delete any existing media for this hospital and insert fresh
  await prisma.hospitalMedia.deleteMany({ where: { hospitalId: hospital.id } });

  await prisma.hospitalMedia.create({
    data: {
      hospitalId: hospital.id,
      url: "/grande-hopsital.webp",
      altText: "Grande International Hospital",
      isPrimary: true,
    },
  });

  console.log("✅ Hospital photo set to /grande-hopsital.webp");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

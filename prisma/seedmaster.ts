import { execSync } from "child_process";

const seeds = [
  "prisma/grande_hospital/seed.ts",
  "prisma/grande_hospital/seed-hospital-photo.ts",
  "prisma/grande_hospital/seed-doctor-photos.ts",
  "prisma/seed-availability.ts",
  "prisma/seed-doctor-fees-eur.ts",
  "prisma/seed-packages.ts",
  "prisma/seed-cmh.ts",
];

for (const script of seeds) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`▶  Running: ${script}`);
  console.log("=".repeat(50));
  execSync(`npx tsx ${script}`, { stdio: "inherit" });
}

console.log("\n✅  All seeds complete.");
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Prices stored in EUR cents (Stripe-ready).
 * Demo seed: same 6 packages for all hospitals.
 */

const packages = [
  {
    title: "Basic Wellness Checkup",
    price: 1500,
    currency: "eur",
    description: `Consultations
- General Physician Consultation

Pathology & Labs
- Complete Blood Count (CBC)
- Fasting Blood Sugar (FBG)
- Lipid Profile (Total Cholesterol, HDL, LDL, Triglycerides)
- Serum Creatinine
- Blood Urea
- SGOT (AST)
- SGPT (ALT)
- Urine Routine

Imaging & Diagnostics
- Chest X-Ray
- Resting ECG`,
  },
  {
    title: "Comprehensive Executive Checkup",
    price: 3000,
    currency: "eur",
    description: `Consultations
- General Physician Consultation
- Dietician Consultation
- Eye Specialist Consultation

Pathology & Labs
- Complete Blood Count (CBC)
- Fasting Blood Sugar (FBG)
- Lipid Profile
- Serum Creatinine
- Blood Urea
- SGOT (AST)
- SGPT (ALT)
- Urine Routine
- HbA1c
- Thyroid Stimulating Hormone (TSH)
- Thyroid Function Test (TFT)
- Uric Acid
- Vitamin D
- Vitamin B12
- Calcium
- Sodium
- Potassium

Imaging & Diagnostics
- Chest X-Ray
- Resting ECG
- Ultrasound (USG) Abdomen & Pelvis
- Echocardiogram (ECHO)
- Treadmill Test (TMT) / Holter Monitor`,
  },
  {
    title: "Comprehensive Women's Wellness",
    price: 2800,
    currency: "eur",
    description: `Consultations
- Gynecologist Consultation
- Dietician Consultation

Pathology & Labs
- Complete Blood Count (CBC)
- Fasting Blood Sugar (FBG)
- Lipid Profile
- Thyroid Stimulating Hormone (TSH)
- Serum Creatinine
- Blood Urea
- SGOT (AST)
- SGPT (ALT)
- Urine Routine

Imaging & Diagnostics
- Ultrasound (USG) Abdomen & Pelvis
- Breast Ultrasound (or Mammography for 40+)

Specialized Tests
- Pap Smear (Cervical cancer screening)`,
  },
  {
    title: "Advanced Child Health Checkup",
    price: 2000,
    currency: "eur",
    description: `Consultations
- Pediatrician Consultation
- Dentist Consultation
- Eye Specialist Consultation

Pathology & Labs
- Complete Blood Count (CBC)
- Blood Grouping & RH Typing
- Calcium
- Phosphorous
- Total Vitamin D
- Peripheral Blood Smear (PBS)
- Bilirubin (Conjugated/Unconjugated)
- Urine Routine

Imaging & Diagnostics
- Ultrasound (USG) Abdomen & Pelvis`,
  },
  {
    title: "Senior Citizen Wellness (60+)",
    price: 2500,
    currency: "eur",
    description: `Consultations
- General Physician Consultation
- Eye Specialist Consultation
- Dietician Consultation

Pathology & Labs
- Complete Blood Count (CBC)
- Fasting Blood Sugar (FBG)
- Lipid Profile
- Serum Creatinine
- Blood Urea
- SGOT (AST)
- SGPT (ALT)
- Urine Routine
- HbA1c
- Thyroid Stimulating Hormone (TSH)
- Calcium
- Uric Acid
- Stool Routine
- Stool Occult Blood
- PSA (for men only)

Imaging & Diagnostics
- Chest X-Ray
- Resting ECG
- Echocardiogram (ECHO)
- Ultrasound (USG) Abdomen & Pelvis

Specialized Tests
- Bone Mineral Density (BMD)
- Puretone Audiometry (PTA - Hearing Test)`,
  },
  {
    title: "Cardiac & Diabetes Care Checkup",
    price: 2200,
    currency: "eur",
    description: `Consultations
- Cardiologist Consultation
- Dietician Consultation

Pathology & Labs
- Complete Blood Count (CBC)
- Fasting Blood Sugar (FBG)
- Post-Prandial Glucose (PPG)
- HbA1c
- Lipid Profile
- Serum Creatinine
- Blood Urea
- Urine Routine
- Urine Microalbumin

Imaging & Diagnostics
- Resting ECG
- Echocardiogram (ECHO)
- Treadmill Test (TMT)
- Body Composition Analysis`,
  },
];

async function main() {
  console.log("📦 Seeding 6 hospital packages...");

  const WIPE_EXISTING_SEEDED_ONLY = true;

  if (WIPE_EXISTING_SEEDED_ONLY) {
    const del = await prisma.hospitalPackage.deleteMany({
      where: { dataOrigin: "SEEDED" }, // ✅ safer wipe
    });
    console.log(`🧹 Deleted seeded packages: ${del.count}`);
  }

  const hospitals = await prisma.hospital.findMany({
    select: { id: true, name: true },
  });

  console.log(`🏥 Hospitals found: ${hospitals.length}`);

  for (const h of hospitals) {
    const res = await prisma.hospitalPackage.createMany({
      data: packages.map((p) => ({
        hospitalId: h.id,
        title: p.title,
        description: p.description,
        price: p.price,
        currency: p.currency,
        isActive: true,
        dataOrigin: "SEEDED", // ✅ correct meaning
      })),
      skipDuplicates: true,
    });

    console.log(`✅ Seeded ${res.count} packages for: ${h.name}`);
  }

  console.log("🎉 Done.");
}

main()
  .catch((e) => {
    console.error("❌ Package seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
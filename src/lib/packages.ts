// src/lib/packages.ts

export const MEDICAL_PACKAGES = {
  "norvic-full-body": {
    name: "Norvic Full Body Checkup",
    price: 150, // Price in EUR/NPR (whatever your currency is)
    hospital: "Norvic International Hospital"
  },
  "kmc-basic-cardio": {
    name: "KMC Basic Cardio",
    price: 80,
    hospital: "KMC Hospital"
  }
};

export type PackageId = keyof typeof MEDICAL_PACKAGES;
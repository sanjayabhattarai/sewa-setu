// src/lib/packages.ts

export const MEDICAL_PACKAGES = {
  "manipal-basic": {
    name: "Basic Health Screening",
    price: 35,
    hospital: "Manipal Teaching Hospital"
  },
  "manipal-senior": {
    name: "Senior Citizen Plan",
    price: 55,
    hospital: "Manipal Teaching Hospital"
  },
  "norvic-whole-body": {
    name: "Whole Body Checkup",
    price: 30,
    hospital: "Norvic International Hospital"
  }
};

export type PackageId = keyof typeof MEDICAL_PACKAGES;
export const MEDICAL_PACKAGES = {
  consultation_online: {
    id: "consultation_online",
    name: "Online Consultation",
    price: 50,
    description: "Video consultation with a doctor",
    duration: 30,
  },
  consultation_physical: {
    id: "consultation_physical",
    name: "Physical Consultation",
    price: 100,
    description: "In-person consultation with a doctor",
    duration: 45,
  },
  general_checkup: {
    id: "general_checkup",
    name: "General Checkup",
    price: 150,
    description: "Comprehensive general health checkup",
    duration: 60,
  },
  appointment: {
    id: "appointment",
    name: "Doctor Appointment",
    price: 75,
    description: "Standard doctor appointment",
    duration: 30,
  },
} as const;

export type PackageId = keyof typeof MEDICAL_PACKAGES;

export function getPackagePrice(packageId: PackageId): number {
  return MEDICAL_PACKAGES[packageId]?.price ?? 0;
}

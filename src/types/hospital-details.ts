export type ApiHospitalDetails = {
  id: string;
  slug: string;
  name: string;
  type: "HOSPITAL" | "CLINIC" | "LAB";
  city: string;
  district: string;
  area: string | null;
  image: string | null;

  rating: number;
  reviewCount: number;
  specialty: string;
  tags: string[];

  services: {
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    features: string[];
  }[];

  doctors: {
    id: string;
    fullName: string;
    gender: string | null;
    experienceYears: number;
    education: string | null;
    bio: string | null;

    verified: boolean;
    licenseNumber: string | null;

    feeMin: number;
    feeMax: number;
    currency: string;

    languages: string[];
    consultationModes: string[];

    positionTitle: string | null;
    isPrimaryAtHospital: boolean;

    primarySpecialty: string | null;
    specialties: string[];

    photo: string | null;

    availabilitySummary: {
      id: string;
      dayOfWeek: number;
      mode: "ONLINE" | "PHYSICAL";
      startTime: string;
      endTime: string;
      slotDurationMinutes: number;
    }[];
  }[];
};
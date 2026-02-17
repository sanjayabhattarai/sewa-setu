export type ApiHospital = {
  id: string;
  slug: string;
  name: string;
  type: "HOSPITAL" | "CLINIC" | "LAB";
  rating: number;
  reviewCount: number;
  specialty: string;
  city: string;
  district: string;
  area: string | null;
  image: string | null;
  fromPrice: number | null;
  currency: string;
  emergencyAvailable?: boolean;
};

export type ApiDoctor = {
  id: string;
  fullName: string;
  gender?: string | null;
  experienceYears: number;
  education?: string | null;
  bio?: string | null;
  languages: string[];
  consultationModes: ("ONLINE" | "PHYSICAL")[];
  licenseNumber?: string | null;
  feeMin: number;
  feeMax: number;
  currency: string;
  verified: boolean;
  image: string | null;

  specialties: {
    id: string;
    name: string;
    slug: string;
    isPrimary: boolean;
  }[];
};

export type ApiAvailabilitySlot = {
  id: string;
  doctorId: string;
  hospitalId: string | null;
  mode: "ONLINE" | "PHYSICAL";
  dayOfWeek: number; // 0-6
  startTime: string; // "10:00"
  endTime: string;   // "13:00"
  slotDurationMinutes: number;
  isActive: boolean;
};

export type ApiHospitalDetails = {
  id: string;
  slug: string;
  name: string;
  type: "HOSPITAL" | "CLINIC" | "LAB";

  verified: boolean;
  emergencyAvailable: boolean;
  openingHours: string | null;

  phone: string | null;
  email: string | null;
  website: string | null;

  servicesSummary: string | null;

  location: {
    country: string;
    district: string;
    city: string;
    area: string | null;
    addressLine: string | null;
    postalCode: string | null;
    lat: number | null;
    lng: number | null;
  };

  image: string | null;
  media: { url: string; altText: string | null; isPrimary: boolean }[];

  rating: number;
  reviewCount: number;

  tags: string[];

  services: {
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    features: string[];
  }[];

  doctors: ApiDoctor[];
  availability: ApiAvailabilitySlot[];
};
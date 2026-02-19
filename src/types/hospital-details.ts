import type { ApiDoctor, ApiAvailabilitySlot } from "./hospital";

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

  // legacy (mapped from packages)
  services: {
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    features: string[];
  }[];

  // NEW: departments from DB
  departments: {
    id: string;
    name: string;
    slug: string;
    overview: string | null;
    doctorCount: number;
    doctors: {
      doctorId: string;
      designation: string | null;
      education: string | null;
      sortOrder: number;
    }[];
  }[];

  doctors: ApiDoctor[];
  availability: ApiAvailabilitySlot[];
};
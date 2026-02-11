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
};
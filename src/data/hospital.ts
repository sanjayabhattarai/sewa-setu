export interface Package {
  id: string;
  name: string;
  price: number;
  discount?: string; 
  features: string[];
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  area: string;
  image: string;
  rating: number;
  reviewCount: number;
  specialty: string;
  tags: string[];
  packages: Package[];
  badges?: string[];
}

export const cities = ["Kathmandu", "Lalitpur", "Pokhara"];

export const hospitals: Hospital[] = [
  {
    id: "manipal",
    name: "Manipal Teaching Hospital",
    city: "Pokhara",
    area: "Fulbari",
    rating: 4.8,
    reviewCount: 120,
    specialty: "General Medicine",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800", // Placeholder for red brick building
    tags: ["Instant Booking", "Teaching Hospital"],
    packages: [
      { 
        id: "manipal-basic",
        name: "Basic Health Screening", 
        price: 35, 
        features: ["General Checkup", "Blood Pressure", "Sugar Test"] 
      },
      { 
        id: "manipal-senior",
        name: "Senior Citizen Plan", 
        price: 55, 
        discount: "Save 15% vs Cash",
        features: [
          "Complete Blood Count", "Blood Sugar Profile",
          "Lipid Profile", "Kidney Function Test",
          "ECG", "Eye Checkup",
          "Geriatrician Consultation"
        ] 
      },
    ],
  },
  {
    id: "norvic",
    name: "Norvic International Hospital",
    city: "Kathmandu",
    area: "Thapathali",
    rating: 4.8,
    reviewCount: 85,
    specialty: "Multi-specialty, VIP Care",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
    tags: ["Corporate Partner", "VIP Services"],
    packages: [
      { id: "norvic-whole-body", name: "Whole Body Checkup", price: 30, features: ["CBC", "Sugar", "Thyroid"] },
    ],
  },
  // ... other hospitals
];
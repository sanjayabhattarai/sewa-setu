import {
  PrismaClient,
  HospitalType,
  ConsultationMode,
  Prisma,
} from "@prisma/client";

const prisma = new PrismaClient();

/** -----------------------
 * Helpers
 * ---------------------- */
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const hospitalImage = (slug: string, i: number) =>
  `https://picsum.photos/seed/${slug}-h${i}/1200/800`;

const doctorImage = (slug: string, i: number) =>
  `https://picsum.photos/seed/${slug}-d${i}/600/600`;

const pickMany = <T,>(arr: T[], count: number) => {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < count) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const toJsonArray = (arr: string[]) => arr as unknown as Prisma.JsonArray;

/** -----------------------
 * Seed Data
 * ---------------------- */
type LocationKey =
  | "kathmandu"
  | "baglung"
  | "rupandehi"
  | "pokhara"
  | "bharatpur"
  | "lalitpur"
  | "biratnagar"
  | "nepalgunj";

const locationSeeds: Record<LocationKey, Prisma.LocationCreateInput> = {
  kathmandu: {
    country: "Nepal",
    province: "Bagmati",
    district: "Kathmandu",
    city: "Kathmandu",
    area: "Maharajgunj",
    addressLine: "Ring Road",
    postalCode: "44600",
    lat: 27.7392,
    lng: 85.335,
  },
  baglung: {
    country: "Nepal",
    province: "Gandaki",
    district: "Baglung",
    city: "Baglung",
    area: "Bazaar",
    addressLine: "Baglung Main Road",
    postalCode: "33300",
    lat: 28.2713,
    lng: 83.589,
  },
  rupandehi: {
    country: "Nepal",
    province: "Lumbini",
    district: "Rupandehi",
    city: "Bhairahawa",
    area: "Siddharthanagar",
    addressLine: "Siddhartha Hwy",
    postalCode: "32900",
    lat: 27.503,
    lng: 83.45,
  },
  pokhara: {
    country: "Nepal",
    province: "Gandaki",
    district: "Kaski",
    city: "Pokhara",
    area: "Lakeside",
    addressLine: "Lakeside Road",
    postalCode: "33700",
    lat: 28.2096,
    lng: 83.9856,
  },
  bharatpur: {
    country: "Nepal",
    province: "Bagmati",
    district: "Chitwan",
    city: "Bharatpur",
    area: "Central",
    addressLine: "Narayani Road",
    postalCode: "44200",
    lat: 27.6833,
    lng: 84.4333,
  },
  lalitpur: {
    country: "Nepal",
    province: "Bagmati",
    district: "Lalitpur",
    city: "Lalitpur",
    area: "Patan",
    addressLine: "Pulchowk",
    postalCode: "44700",
    lat: 27.6766,
    lng: 85.3142,
  },
  biratnagar: {
    country: "Nepal",
    province: "Koshi",
    district: "Morang",
    city: "Biratnagar",
    area: "Main Road",
    addressLine: "Traffic Chowk",
    postalCode: "56613",
    lat: 26.4525,
    lng: 87.2718,
  },
  nepalgunj: {
    country: "Nepal",
    province: "Lumbini",
    district: "Banke",
    city: "Nepalgunj",
    area: "Dhamboji",
    addressLine: "Hospital Road",
    postalCode: "21900",
    lat: 28.05,
    lng: 81.6167,
  },
};

const TAGS = [
  "VIP Fast-Track",
  "Online Consultation",
  "Emergency",
  "Pediatrics Friendly",
  "Women Care",
  "Skin & Allergy",
  "Wheelchair Accessible",
  "Insurance Support",
  "Lab + Imaging",
  "24/7 Pharmacy",
];

const SPECIALTIES = [
  { name: "General Medicine", slug: "general-medicine", keywords: "fever,cough,cold,headache,weakness" },
  { name: "Cardiology", slug: "cardiology", keywords: "chest pain,heart,blood pressure,ECG" },
  { name: "Dermatology", slug: "dermatology", keywords: "skin,rash,acne,itching,allergy" },
  { name: "Orthopedics", slug: "orthopedics", keywords: "bone,joint pain,fracture,back pain" },
  { name: "Gynecology", slug: "gynecology", keywords: "pregnancy,periods,women health,PCOS" },
  { name: "Pediatrics", slug: "pediatrics", keywords: "child fever,vaccination,baby care" },
  { name: "Neurology", slug: "neurology", keywords: "headache,migraine,seizure,nerve" },
  { name: "ENT", slug: "ent", keywords: "ear,nose,throat,sinus" },
  { name: "Ophthalmology", slug: "ophthalmology", keywords: "eye,vision,glasses" },
  { name: "Radiology", slug: "radiology", keywords: "xray,ct,mri,imaging" },
];

type HospitalSeed = {
  name: string;
  type: HospitalType;
  locationKey: LocationKey;
  emergencyAvailable: boolean;
  servicesSummary: string;
  verified: boolean;
  openingHours: string;
  phone: string;
  email?: string;
  website?: string;
  tags: string[];
  services: { title: string; price: number; currency: string; description: string }[];
};

const HOSPITALS: HospitalSeed[] = [
  {
    name: "Kathmandu City Hospital",
    type: HospitalType.HOSPITAL,
    locationKey: "kathmandu",
    emergencyAvailable: true,
    servicesSummary: "Multi-specialty hospital with emergency, imaging, and surgical care.",
    verified: true,
    openingHours: "Mon-Sat 08:00-18:00",
    phone: "+977-1-5550000",
    email: "info@kathmanducityhospital.com",
    website: "https://kathmanducityhospital.com",
    tags: ["Emergency", "VIP Fast-Track", "Lab + Imaging", "Insurance Support"],
    services: [
      { title: "OPD Consultation", price: 1200, currency: "NPR", description: "General OPD consultation with report review." },
      { title: "VIP Fast-Track Appointment", price: 2500, currency: "NPR", description: "Priority consultation with minimal waiting." },
      { title: "ECG + Doctor Review", price: 1800, currency: "NPR", description: "ECG test with doctor review and advice." },
      { title: "Full Body Checkup", price: 6500, currency: "NPR", description: "CBC, LFT, KFT, lipid, sugar + screening." },
    ],
  },
  {
    name: "Baglung Community Clinic",
    type: HospitalType.CLINIC,
    locationKey: "baglung",
    emergencyAvailable: false,
    servicesSummary: "Affordable clinic with general medicine, minor procedures, and basic lab tests.",
    verified: true,
    openingHours: "Sun-Fri 09:00-17:00",
    phone: "+977-68-420000",
    email: "help@baglungclinic.com",
    website: "https://baglungclinic.com",
    tags: ["Online Consultation", "Pediatrics Friendly", "Wheelchair Accessible"],
    services: [
      { title: "General OPD Package", price: 800, currency: "NPR", description: "Basic OPD consultation and checkup." },
      { title: "Diabetes Follow-up", price: 900, currency: "NPR", description: "Sugar review + medicine adjustment." },
      { title: "Blood Pressure Check + Advice", price: 500, currency: "NPR", description: "BP check with counseling." },
    ],
  },
  {
    name: "Rupandehi Diagnostic Lab",
    type: HospitalType.LAB,
    locationKey: "rupandehi",
    emergencyAvailable: false,
    servicesSummary: "Lab services, blood tests, ECG, imaging referrals.",
    verified: false,
    openingHours: "Daily 07:00-19:00",
    phone: "+977-71-500000",
    email: "support@rupandehilab.com",
    website: "https://rupandehilab.com",
    tags: ["Lab + Imaging", "24/7 Pharmacy"],
    services: [
      { title: "Full Body Checkup", price: 3500, currency: "NPR", description: "Blood panel + basic screening tests." },
      { title: "CBC + ESR", price: 850, currency: "NPR", description: "Complete blood count with ESR." },
      { title: "Lipid Profile", price: 1200, currency: "NPR", description: "Cholesterol, HDL, LDL, triglycerides." },
    ],
  },
  {
    name: "Pokhara Lakeside Hospital",
    type: HospitalType.HOSPITAL,
    locationKey: "pokhara",
    emergencyAvailable: true,
    servicesSummary: "Modern care with emergency, specialist clinics, and imaging support.",
    verified: true,
    openingHours: "Daily 08:00-20:00",
    phone: "+977-61-555555",
    email: "info@pokharalakesidehospital.com",
    website: "https://pokharalakesidehospital.com",
    tags: ["Emergency", "Lab + Imaging", "Insurance Support"],
    services: [
      { title: "OPD Consultation", price: 1300, currency: "NPR", description: "Consultation with general physician." },
      { title: "Skin & Allergy Check", price: 1500, currency: "NPR", description: "Dermatology consult for allergy/skin conditions." },
      { title: "Orthopedic Review", price: 1800, currency: "NPR", description: "Bone/joint pain review with plan." },
      { title: "ECG Test", price: 900, currency: "NPR", description: "Standard ECG test report." },
    ],
  },
  {
    name: "Bharatpur Cancer Care Center",
    type: HospitalType.HOSPITAL,
    locationKey: "bharatpur",
    emergencyAvailable: true,
    servicesSummary: "Specialist center with oncology support, diagnostics, and referrals.",
    verified: true,
    openingHours: "Mon-Sat 08:00-18:00",
    phone: "+977-56-700700",
    email: "contact@bharatpurcancercare.com",
    website: "https://bharatpurcancercare.com",
    tags: ["Emergency", "Lab + Imaging", "VIP Fast-Track"],
    services: [
      { title: "Specialist Consultation", price: 2500, currency: "NPR", description: "Specialist consult with report evaluation." },
      { title: "Imaging Referral Support", price: 1500, currency: "NPR", description: "Guided referral for imaging + interpretation help." },
      { title: "Biopsy Guidance Package", price: 4500, currency: "NPR", description: "Pre-procedure guidance + lab coordination." },
    ],
  },
  {
    name: "Lalitpur Women & Child Clinic",
    type: HospitalType.CLINIC,
    locationKey: "lalitpur",
    emergencyAvailable: false,
    servicesSummary: "Women and child care with gynecology, pediatrics, and vaccination support.",
    verified: true,
    openingHours: "Sun-Fri 09:00-18:00",
    phone: "+977-1-5909090",
    email: "hello@womenchildclinic.com",
    website: "https://womenchildclinic.com",
    tags: ["Women Care", "Pediatrics Friendly", "Online Consultation"],
    services: [
      { title: "Gynecology Consultation", price: 1500, currency: "NPR", description: "Women health consultation and guidance." },
      { title: "Pediatrics Consultation", price: 1200, currency: "NPR", description: "Child fever, growth, and vaccination advice." },
      { title: "Antenatal Checkup", price: 2200, currency: "NPR", description: "Routine pregnancy checkup with counseling." },
    ],
  },
  {
    name: "Biratnagar Heart & Neuro Hospital",
    type: HospitalType.HOSPITAL,
    locationKey: "biratnagar",
    emergencyAvailable: true,
    servicesSummary: "Cardio-neuro specialist hospital with diagnostics and emergency support.",
    verified: true,
    openingHours: "Daily 08:00-20:00",
    phone: "+977-21-888888",
    email: "info@biratnagarheartneuro.com",
    website: "https://biratnagarheartneuro.com",
    tags: ["Emergency", "Lab + Imaging", "Insurance Support", "VIP Fast-Track"],
    services: [
      { title: "Cardiology Consultation", price: 2800, currency: "NPR", description: "Heart specialist consult with ECG review." },
      { title: "Neurology Consultation", price: 2600, currency: "NPR", description: "Neuro consult for headache/seizure/nerve issues." },
      { title: "ECG + Echo Referral", price: 3500, currency: "NPR", description: "ECG with echo referral assistance." },
    ],
  },
  {
    name: "Nepalgunj Family Clinic",
    type: HospitalType.CLINIC,
    locationKey: "nepalgunj",
    emergencyAvailable: false,
    servicesSummary: "Family clinic with general medicine, ENT, and basic diagnostics.",
    verified: false,
    openingHours: "Sun-Fri 09:00-17:00",
    phone: "+977-81-777777",
    email: "support@nepalgunjfamilyclinic.com",
    website: "https://nepalgunjfamilyclinic.com",
    tags: ["Online Consultation", "Wheelchair Accessible"],
    services: [
      { title: "Family OPD Consultation", price: 900, currency: "NPR", description: "General OPD for family health issues." },
      { title: "ENT Consultation", price: 1200, currency: "NPR", description: "Sinus, throat pain, ear issues consultation." },
      { title: "Basic Lab Screening", price: 1100, currency: "NPR", description: "CBC + sugar basic tests." },
    ],
  },
];

type DoctorTemplate = {
  fullName: string;
  gender: "Male" | "Female";
  education: string;
  bio: string;
  languages: string[];
  modes: ConsultationMode[];
  primarySpecialtySlug: string;
  secondarySpecialtySlug?: string;
  tags: string[];
  feeMin: number;
  feeMax: number;
  verified: boolean;
};

const DOCTORS_POOL: DoctorTemplate[] = [
  {
    fullName: "Dr. Suman Karki",
    gender: "Male",
    education: "MBBS, MD (Internal Medicine)",
    bio: "Experienced physician focusing on general medicine and preventive care.",
    languages: ["Nepali", "English"],
    modes: [ConsultationMode.ONLINE, ConsultationMode.PHYSICAL],
    primarySpecialtySlug: "general-medicine",
    secondarySpecialtySlug: "orthopedics",
    tags: ["Online Consultation"],
    feeMin: 800,
    feeMax: 1500,
    verified: true,
  },
  {
    fullName: "Dr. Asha Shrestha",
    gender: "Female",
    education: "MBBS, MD (Dermatology)",
    bio: "Skin specialist for acne, allergy, and chronic skin conditions.",
    languages: ["Nepali", "English"],
    modes: [ConsultationMode.PHYSICAL],
    primarySpecialtySlug: "dermatology",
    tags: ["Skin & Allergy"],
    feeMin: 1000,
    feeMax: 1800,
    verified: true,
  },
  {
    fullName: "Dr. Ramesh Adhikari",
    gender: "Male",
    education: "MBBS, DM (Cardiology)",
    bio: "Heart specialist for ECG evaluation and blood pressure management.",
    languages: ["Nepali", "English", "Hindi"],
    modes: [ConsultationMode.PHYSICAL],
    primarySpecialtySlug: "cardiology",
    tags: ["VIP Fast-Track"],
    feeMin: 1800,
    feeMax: 3200,
    verified: false,
  },
  {
    fullName: "Dr. Nisha Thapa",
    gender: "Female",
    education: "MBBS, MS (Gynecology)",
    bio: "Women health, antenatal care, and hormonal health support.",
    languages: ["Nepali", "English"],
    modes: [ConsultationMode.PHYSICAL, ConsultationMode.ONLINE],
    primarySpecialtySlug: "gynecology",
    tags: ["Women Care", "Online Consultation"],
    feeMin: 1400,
    feeMax: 2400,
    verified: true,
  },
  {
    fullName: "Dr. Prakash Gurung",
    gender: "Male",
    education: "MBBS, MD (Pediatrics)",
    bio: "Child fever, growth monitoring, vaccinations, and pediatric counseling.",
    languages: ["Nepali", "English"],
    modes: [ConsultationMode.PHYSICAL],
    primarySpecialtySlug: "pediatrics",
    tags: ["Pediatrics Friendly"],
    feeMin: 1200,
    feeMax: 2000,
    verified: true,
  },
  {
    fullName: "Dr. Sita Khadka",
    gender: "Female",
    education: "MBBS, MS (Orthopedics)",
    bio: "Joint pain, sports injury, fracture follow-ups, and rehab guidance.",
    languages: ["Nepali", "English"],
    modes: [ConsultationMode.PHYSICAL],
    primarySpecialtySlug: "orthopedics",
    tags: ["Insurance Support"],
    feeMin: 1500,
    feeMax: 2600,
    verified: true,
  },
  {
    fullName: "Dr. Manoj Yadav",
    gender: "Male",
    education: "MBBS, MD (Neurology)",
    bio: "Migraine, nerve pain, seizure evaluation, and neuro follow-up care.",
    languages: ["Nepali", "English", "Hindi"],
    modes: [ConsultationMode.PHYSICAL],
    primarySpecialtySlug: "neurology",
    tags: ["Lab + Imaging"],
    feeMin: 2000,
    feeMax: 3200,
    verified: false,
  },
  {
    fullName: "Dr. Anil Shah",
    gender: "Male",
    education: "MBBS, MS (ENT)",
    bio: "ENT care: sinus, ear infections, throat pain, and allergy issues.",
    languages: ["Nepali", "English"],
    modes: [ConsultationMode.PHYSICAL, ConsultationMode.ONLINE],
    primarySpecialtySlug: "ent",
    tags: ["Online Consultation"],
    feeMin: 1200,
    feeMax: 2200,
    verified: true,
  },
  {
    fullName: "Dr. Binita Rai",
    gender: "Female",
    education: "MBBS, MS (Ophthalmology)",
    bio: "Eye checkups, vision problems, and follow-up guidance.",
    languages: ["Nepali", "English"],
    modes: [ConsultationMode.PHYSICAL],
    primarySpecialtySlug: "ophthalmology",
    tags: ["VIP Fast-Track"],
    feeMin: 1300,
    feeMax: 2300,
    verified: true,
  },
];

async function main() {
  console.log("🌱 Seeding started...");

  // --------- 0) Clean old seed data (safe order) ----------
  await prisma.availabilitySlot.deleteMany();
  await prisma.doctorMedia.deleteMany();
  await prisma.hospitalMedia.deleteMany();

  await prisma.doctorTag.deleteMany();
  await prisma.hospitalTag.deleteMany();

  await prisma.doctorSpecialty.deleteMany();
  await prisma.doctorHospital.deleteMany();

  await prisma.doctorService.deleteMany();
  await prisma.hospitalService.deleteMany();

  // NOTE: We are NOT deleting bookings/users/patients here.
  await prisma.doctor.deleteMany();
  await prisma.hospital.deleteMany();

  await prisma.tag.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.location.deleteMany();

  // --------- 1) Locations ----------
  await prisma.location.createMany({
    data: Object.values(locationSeeds),
  });

  const allLocations = await prisma.location.findMany();
  const locationMap = (Object.keys(locationSeeds) as LocationKey[]).reduce(
    (acc, key) => {
      const seed = locationSeeds[key];
      const found = allLocations.find(
        (l) => l.district === seed.district && l.city === seed.city
      );
      if (!found) throw new Error(`Location not found for key: ${key}`);
      acc[key] = found;
      return acc;
    },
    {} as Record<LocationKey, (typeof allLocations)[number]>
  );

  // --------- 2) Tags ----------
  await prisma.tag.createMany({
    data: TAGS.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const tags = await prisma.tag.findMany();
  const tagByName = (name: string) => {
    const t = tags.find((x) => x.name === name);
    if (!t) throw new Error(`Tag not found: ${name}`);
    return t;
  };

  // --------- 3) Specialties ----------
  await prisma.specialty.createMany({
    data: SPECIALTIES,
    skipDuplicates: true,
  });

  const specialties = await prisma.specialty.findMany();
  const specBySlug = (slug: string) => {
    const s = specialties.find((x) => x.slug === slug);
    if (!s) throw new Error(`Specialty not found: ${slug}`);
    return s;
  };

  // --------- 4) Hospitals + Media + Tags + Services + Doctors ----------
  let licenseCounter = 10000;

  const createdHospitals: { name: string; slug: string }[] = [];
  const createdDoctors: string[] = [];

  for (const h of HOSPITALS) {
    const slug = slugify(h.name);

    const hospital = await prisma.hospital.create({
      data: {
        slug,
        name: h.name,
        type: h.type,
        locationId: locationMap[h.locationKey].id,
        phone: h.phone,
        email: h.email ?? `info@${slug}.com`,
        website: h.website ?? `https://${slug}.com`,
        openingHours: h.openingHours,
        emergencyAvailable: h.emergencyAvailable,
        servicesSummary: h.servicesSummary,
        verified: h.verified,
      },
    });

    createdHospitals.push({ name: hospital.name, slug: hospital.slug });

    // Hospital media gallery (1 primary + 2 gallery)
    await prisma.hospitalMedia.createMany({
      data: [
        {
          hospitalId: hospital.id,
          url: hospitalImage(slug, 1),
          altText: "Hospital exterior",
          isPrimary: true,
        },
        {
          hospitalId: hospital.id,
          url: hospitalImage(slug, 2),
          altText: "Reception area",
          isPrimary: false,
        },
        {
          hospitalId: hospital.id,
          url: hospitalImage(slug, 3),
          altText: "Facilities",
          isPrimary: false,
        },
      ],
      skipDuplicates: true,
    });

    // Hospital tags
    await prisma.hospitalTag.createMany({
      data: h.tags.map((t) => ({
        hospitalId: hospital.id,
        tagId: tagByName(t).id,
      })),
      skipDuplicates: true,
    });

    // Hospital services (packages)
    await prisma.hospitalService.createMany({
      data: h.services.map((s) => ({
        hospitalId: hospital.id,
        title: s.title,
        price: s.price,
        currency: s.currency,
        description: s.description,
        isActive: true,
      })),
      skipDuplicates: true,
    });

    // Doctors per hospital (5–9)
    const doctorCount = randInt(5, 9);
    const picked = pickMany(DOCTORS_POOL, Math.min(doctorCount, DOCTORS_POOL.length));

    // If pool runs short (rare), allow reuse by random picks
    const finalDoctors =
      picked.length >= doctorCount
        ? picked
        : [...picked, ...Array.from({ length: doctorCount - picked.length }, () => DOCTORS_POOL[randInt(0, DOCTORS_POOL.length - 1)])];

    let doctorIndex = 1;

    for (const d of finalDoctors) {
      const doctorSlug = slugify(`${hospital.slug}-${d.fullName}-${doctorIndex}`);

      const doctor = await prisma.doctor.create({
        data: {
          fullName: d.fullName,
          gender: d.gender,
          experienceYears: randInt(3, 16),
          education: d.education,
          bio: d.bio,
          languages: toJsonArray(d.languages),
          consultationModes: toJsonArray(d.modes.map((m) => m)),
          licenseNumber: `NMC-${licenseCounter++}`,
          feeMin: d.feeMin,
          feeMax: d.feeMax,
          currency: "NPR",
          verified: d.verified,
        },
      });

      createdDoctors.push(doctor.fullName);

      // Doctor media
      await prisma.doctorMedia.createMany({
        data: [
          {
            doctorId: doctor.id,
            url: doctorImage(doctorSlug, 1),
            altText: "Doctor profile",
            isPrimary: true,
          },
          {
            doctorId: doctor.id,
            url: doctorImage(doctorSlug, 2),
            altText: "Doctor profile",
            isPrimary: false,
          },
        ],
        skipDuplicates: true,
      });

      // Doctor ↔ Hospital (primary)
      await prisma.doctorHospital.create({
        data: {
          doctorId: doctor.id,
          hospitalId: hospital.id,
          isPrimary: true,
          positionTitle:
            d.primarySpecialtySlug === "general-medicine"
              ? "Physician"
              : d.primarySpecialtySlug === "cardiology"
              ? "Cardiologist"
              : d.primarySpecialtySlug === "dermatology"
              ? "Dermatologist"
              : d.primarySpecialtySlug === "pediatrics"
              ? "Pediatrician"
              : "Consultant",
        },
      });

      // Doctor ↔ Specialty (primary + optional secondary)
      await prisma.doctorSpecialty.create({
        data: {
          doctorId: doctor.id,
          specialtyId: specBySlug(d.primarySpecialtySlug).id,
          isPrimary: true,
        },
      });

      if (d.secondarySpecialtySlug) {
        await prisma.doctorSpecialty.create({
          data: {
            doctorId: doctor.id,
            specialtyId: specBySlug(d.secondarySpecialtySlug).id,
            isPrimary: false,
          },
        });
      }

      // Doctor tags
      const doctorTags = pickMany(d.tags.length ? d.tags : TAGS, randInt(1, 2));
      await prisma.doctorTag.createMany({
        data: doctorTags.map((t) => ({
          doctorId: doctor.id,
          tagId: tagByName(t).id,
        })),
        skipDuplicates: true,
      });

      // Doctor services (2–4)
      const possibleServices = [
        { title: "Consultation", price: randInt(d.feeMin, d.feeMax), durationMinutes: 20 },
        { title: "Follow-up Visit", price: Math.max(500, randInt(d.feeMin, d.feeMax) - 300), durationMinutes: 15 },
        { title: "Report Review", price: randInt(600, 1200), durationMinutes: 15 },
        { title: "Second Opinion", price: randInt(1200, 2500), durationMinutes: 25 },
      ];
      const doctorServices = pickMany(possibleServices, randInt(2, 4));

      await prisma.doctorService.createMany({
        data: doctorServices.map((s) => ({
          doctorId: doctor.id,
          title: `${d.primarySpecialtySlug.replace("-", " ")} ${s.title}`.replace(/\b\w/g, (c) => c.toUpperCase()),
          price: s.price,
          currency: "NPR",
          durationMinutes: s.durationMinutes,
          isActive: true,
        })),
        skipDuplicates: true,
      });

      // Availability slots (3–6)
      const slotCount = randInt(3, 6);
      const days = pickMany([0, 1, 2, 3, 4, 5, 6], slotCount);
      const modesToUse = d.modes.length ? d.modes : [ConsultationMode.PHYSICAL];

      const slotData: Prisma.AvailabilitySlotCreateManyInput[] = days.map((day) => {
        const mode = modesToUse[randInt(0, modesToUse.length - 1)];
        // create nice ranges
        const startHour = randInt(9, 16);
        const endHour = Math.min(startHour + randInt(2, 4), 20);
        const startTime = `${String(startHour).padStart(2, "0")}:00`;
        const endTime = `${String(endHour).padStart(2, "0")}:00`;

        return {
          doctorId: doctor.id,
          hospitalId: mode === ConsultationMode.PHYSICAL ? hospital.id : null,
          mode,
          dayOfWeek: day,
          startTime,
          endTime,
          slotDurationMinutes: 20,
          isActive: true,
        };
      });

      await prisma.availabilitySlot.createMany({
        data: slotData,
        skipDuplicates: true,
      });

      doctorIndex++;
    }
  }

  console.log("✅ Seed completed successfully!");
  console.log({
    hospitalsSeeded: createdHospitals,
    doctorsSeededCount: createdDoctors.length,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

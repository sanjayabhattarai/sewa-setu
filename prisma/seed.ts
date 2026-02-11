import {
  PrismaClient,
  HospitalType,
  ConsultationMode,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding started...");

  // --------- 0) Clean old seed data (safe order) ----------
  // (Use deleteMany instead of deleting DB to allow reruns)
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
  // Because your app may create real users/patients later.
  // If you want a full reset, tell me and I’ll give a “wipe all” version.

  await prisma.doctor.deleteMany();
  await prisma.hospital.deleteMany();

  await prisma.tag.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.location.deleteMany();

  // --------- 1) Locations ----------
  const locations = await prisma.location.createMany({
    data: [
      {
        country: "Nepal",
        province: "Bagmati",
        district: "Kathmandu",
        city: "Kathmandu",
        area: "Maharajgunj",
        addressLine: "Ring Road",
        postalCode: "44600",
        lat: 27.7392,
        lng: 85.3350,
      },
      {
        country: "Nepal",
        province: "Gandaki",
        district: "Baglung",
        city: "Baglung",
        area: "Bazaar",
        addressLine: "Baglung Main Road",
        postalCode: "33300",
        lat: 28.2713,
        lng: 83.5890,
      },
      {
        country: "Nepal",
        province: "Lumbini",
        district: "Rupandehi",
        city: "Bhairahawa",
        area: "Siddharthanagar",
        addressLine: "Siddhartha Hwy",
        postalCode: "32900",
        lat: 27.5030,
        lng: 83.4500,
      },
    ],
  });

  const allLocations = await prisma.location.findMany();
  const kathmanduLoc = allLocations.find((l) => l.district === "Kathmandu")!;
  const baglungLoc = allLocations.find((l) => l.district === "Baglung")!;
  const rupandehiLoc = allLocations.find((l) => l.district === "Rupandehi")!;

  // --------- 2) Tags ----------
  await prisma.tag.createMany({
    data: [
      { name: "VIP Fast-Track" },
      { name: "Online Consultation" },
      { name: "Emergency" },
      { name: "Pediatrics Friendly" },
      { name: "Women Care" },
      { name: "Skin & Allergy" },
    ],
    skipDuplicates: true,
  });

  const tags = await prisma.tag.findMany();
  const tagByName = (name: string) => tags.find((t) => t.name === name)!;

  // --------- 3) Specialties ----------
  await prisma.specialty.createMany({
    data: [
      { name: "General Medicine", slug: "general-medicine", keywords: "fever,cough,cold,headache,weakness" },
      { name: "Cardiology", slug: "cardiology", keywords: "chest pain,heart,blood pressure,ECG" },
      { name: "Dermatology", slug: "dermatology", keywords: "skin,rash,acne,itching,allergy" },
      { name: "Orthopedics", slug: "orthopedics", keywords: "bone,joint pain,fracture,back pain" },
      { name: "Gynecology", slug: "gynecology", keywords: "pregnancy,periods,women health,PCOS" },
      { name: "Pediatrics", slug: "pediatrics", keywords: "child fever,vaccination,baby care" },
    ],
    skipDuplicates: true,
  });

  const specialties = await prisma.specialty.findMany();
  const specBySlug = (slug: string) => specialties.find((s) => s.slug === slug)!;

  // --------- 4) Hospitals ----------
  const hospital1 = await prisma.hospital.create({
    data: {
    slug: "kathmandu-city-hospital",
      name: "Kathmandu City Hospital",
      type: HospitalType.HOSPITAL,
      locationId: kathmanduLoc.id,
      phone: "+977-1-5550000",
      email: "info@kathmanducityhospital.com",
      website: "https://example.com/kathmandu-hospital",
      openingHours: "Mon-Sat 08:00-18:00",
      emergencyAvailable: true,
      servicesSummary: "Multi-specialty hospital with emergency and diagnostics.",
      verified: true,
    },
  });

  const hospital2 = await prisma.hospital.create({
    data: {
      slug: "baglung-community-clinic",
      name: "Baglung Community Clinic",
      type: HospitalType.CLINIC,
      locationId: baglungLoc.id,
      phone: "+977-68-420000",
      openingHours: "Sun-Fri 09:00-17:00",
      emergencyAvailable: false,
      servicesSummary: "Affordable clinic with general medicine and basic lab tests.",
      verified: true,
    },
  });

  const hospital3 = await prisma.hospital.create({
    data: {
    slug: "rupandehi-diagnostic-lab", 
      name: "Rupandehi Diagnostic Lab",
      type: HospitalType.LAB,
      locationId: rupandehiLoc.id,
      phone: "+977-71-500000",
      openingHours: "Daily 07:00-19:00",
      emergencyAvailable: false,
      servicesSummary: "Lab services, blood tests, ECG, imaging referrals.",
      verified: false,
    },
  });

  // --------- 5) Hospital Tags ----------
  await prisma.hospitalTag.createMany({
    data: [
      { hospitalId: hospital1.id, tagId: tagByName("Emergency").id },
      { hospitalId: hospital1.id, tagId: tagByName("VIP Fast-Track").id },
      { hospitalId: hospital2.id, tagId: tagByName("Online Consultation").id },
      { hospitalId: hospital2.id, tagId: tagByName("Pediatrics Friendly").id },
    ],
    skipDuplicates: true,
  });

  // --------- 6) Hospital Services ----------
  const hs1 = await prisma.hospitalService.create({
    data: {
      hospitalId: hospital1.id,
      title: "VIP Fast-Track Appointment",
      price: 2500,
      currency: "NPR",
      description: "Priority consultation with minimal waiting.",
      isActive: true,
    },
  });

  const hs2 = await prisma.hospitalService.create({
    data: {
      hospitalId: hospital2.id,
      title: "General OPD Package",
      price: 800,
      currency: "NPR",
      description: "Basic OPD consultation and checkup.",
      isActive: true,
    },
  });

  const hs3 = await prisma.hospitalService.create({
    data: {
      hospitalId: hospital3.id,
      title: "Full Body Checkup",
      price: 3500,
      currency: "NPR",
      description: "Blood panel + basic screening tests.",
      isActive: true,
    },
  });

  // --------- 7) Doctors ----------
  const doctor1 = await prisma.doctor.create({
    data: {
      fullName: "Dr. Suman Karki",
      gender: "Male",
      experienceYears: 8,
      education: "MBBS, MD (Internal Medicine)",
      bio: "Experienced physician focusing on general medicine and preventive care.",
      languages: ["Nepali", "English"] as any,
      consultationModes: ["ONLINE", "PHYSICAL"] as any,
      licenseNumber: "NMC-12345",
      feeMin: 800,
      feeMax: 1500,
      currency: "NPR",
      verified: true,
    },
  });

  const doctor2 = await prisma.doctor.create({
    data: {
      fullName: "Dr. Asha Shrestha",
      gender: "Female",
      experienceYears: 6,
      education: "MBBS, MD (Dermatology)",
      bio: "Skin specialist for acne, allergy, and chronic skin conditions.",
      languages: ["Nepali", "English"],
      consultationModes: ["PHYSICAL"],
      licenseNumber: "NMC-23456",
      feeMin: 700,
      feeMax: 1200,
      currency: "NPR",
      verified: true,
    },
  });

  const doctor3 = await prisma.doctor.create({
    data: {
      fullName: "Dr. Ramesh Adhikari",
      gender: "Male",
      experienceYears: 10,
      education: "MBBS, DM (Cardiology)",
      bio: "Heart specialist for ECG evaluation and blood pressure management.",
      languages: ["Nepali", "English", "Hindi"],
      consultationModes: ["PHYSICAL"],
      licenseNumber: "NMC-34567",
      feeMin: 1500,
      feeMax: 3000,
      currency: "NPR",
      verified: false,
    },
  });

  // --------- 8) Doctor ↔ Hospital ----------
  await prisma.doctorHospital.createMany({
    data: [
      { doctorId: doctor1.id, hospitalId: hospital1.id, isPrimary: true, positionTitle: "Physician" },
      { doctorId: doctor1.id, hospitalId: hospital2.id, isPrimary: false, positionTitle: "Visiting Doctor" },
      { doctorId: doctor2.id, hospitalId: hospital1.id, isPrimary: true, positionTitle: "Dermatologist" },
      { doctorId: doctor3.id, hospitalId: hospital1.id, isPrimary: true, positionTitle: "Cardiologist" },
    ],
    skipDuplicates: true,
  });

  // --------- 9) Doctor ↔ Specialty ----------
  await prisma.doctorSpecialty.createMany({
    data: [
      { doctorId: doctor1.id, specialtyId: specBySlug("general-medicine").id, isPrimary: true },
      { doctorId: doctor1.id, specialtyId: specBySlug("orthopedics").id, isPrimary: false },
      { doctorId: doctor2.id, specialtyId: specBySlug("dermatology").id, isPrimary: true },
      { doctorId: doctor3.id, specialtyId: specBySlug("cardiology").id, isPrimary: true },
    ],
    skipDuplicates: true,
  });

  // --------- 10) Doctor Tags ----------
  await prisma.doctorTag.createMany({
    data: [
      { doctorId: doctor1.id, tagId: tagByName("Online Consultation").id },
      { doctorId: doctor2.id, tagId: tagByName("Skin & Allergy").id },
      { doctorId: doctor3.id, tagId: tagByName("VIP Fast-Track").id },
    ],
    skipDuplicates: true,
  });

  // --------- 11) Doctor Services ----------
  const ds1 = await prisma.doctorService.create({
    data: {
      doctorId: doctor1.id,
      title: "General Consultation",
      price: 1000,
      currency: "NPR",
      durationMinutes: 20,
      isActive: true,
    },
  });

  const ds2 = await prisma.doctorService.create({
    data: {
      doctorId: doctor2.id,
      title: "Skin Consultation",
      price: 1200,
      currency: "NPR",
      durationMinutes: 20,
      isActive: true,
    },
  });

  // --------- 12) Availability Slots ----------
  await prisma.availabilitySlot.createMany({
    data: [
      {
        doctorId: doctor1.id,
        hospitalId: hospital1.id,
        mode: ConsultationMode.PHYSICAL,
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "13:00",
        slotDurationMinutes: 20,
        isActive: true,
      },
      {
        doctorId: doctor1.id,
        mode: ConsultationMode.ONLINE,
        dayOfWeek: 3,
        startTime: "18:00",
        endTime: "20:00",
        slotDurationMinutes: 20,
        isActive: true,
      },
      {
        doctorId: doctor2.id,
        hospitalId: hospital1.id,
        mode: ConsultationMode.PHYSICAL,
        dayOfWeek: 5,
        startTime: "09:00",
        endTime: "12:00",
        slotDurationMinutes: 20,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  // --------- 13) Media (optional placeholders) ----------
  await prisma.hospitalMedia.createMany({
    data: [
      { hospitalId: hospital1.id, url: "https://picsum.photos/seed/hospital1/800/600", altText: "Hospital building", isPrimary: true },
      { hospitalId: hospital2.id, url: "https://picsum.photos/seed/hospital2/800/600", altText: "Clinic building", isPrimary: true },
    ],
    skipDuplicates: true,
  });

  await prisma.doctorMedia.createMany({
    data: [
      { doctorId: doctor1.id, url: "https://picsum.photos/seed/doctor1/600/600", altText: "Doctor profile", isPrimary: true },
      { doctorId: doctor2.id, url: "https://picsum.photos/seed/doctor2/600/600", altText: "Doctor profile", isPrimary: true },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed completed successfully!");
  console.log({
    hospitals: [hospital1.name, hospital2.name, hospital3.name],
    doctors: [doctor1.fullName, doctor2.fullName, doctor3.fullName],
    hospitalServices: [hs1.title, hs2.title, hs3.title],
    doctorServices: [ds1.title, ds2.title],
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
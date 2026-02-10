generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

/* =========================
   ENUMS
========================= */

enum UserRole {
  USER
  ADMIN
}

enum HospitalType {
  HOSPITAL
  CLINIC
  LAB
}

enum ConsultationMode {
  ONLINE
  PHYSICAL
}

enum BookingStatus {
  DRAFT
  REQUESTED
  CONFIRMED
  CANCELLED
  COMPLETED
}

/* =========================
   ACCOUNTS & PATIENTS
========================= */

model User {
  id        String   @id @default(cuid())
  fullName  String
  email     String   @unique
  phone     String?
  country   String
  role      UserRole @default(USER)

  patients  Patient[]
  bookings  Booking[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Patient {
  id          String   @id @default(cuid())
  userId      String
  fullName    String
  gender      String?
  dateOfBirth DateTime?
  phone       String?
  notes       String?

  locationId  String?
  location    Location? @relation(fields: [locationId], references: [id], onDelete: SetNull)

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  bookings    Booking[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([locationId])
}

/* =========================
   LOCATION & CLASSIFICATION
========================= */

model Location {
  id          String   @id @default(cuid())
  country     String
  province    String?
  district    String
  city        String
  area        String?
  addressLine String?
  postalCode  String?
  lat         Float?
  lng         Float?

  hospitals   Hospital[]
  patients    Patient[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([country, district, city])
}

model Specialty {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  keywords    String?  // optional string, or keep keywords for AI mapping

  doctors     DoctorSpecialty[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}

model Tag {
  id        String   @id @default(cuid())
  name      String   @unique

  doctors   DoctorTag[]
  hospitals HospitalTag[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

/* =========================
   PROVIDERS: HOSPITALS
========================= */

model Hospital {
  id                 String       @id @default(cuid())
  name               String
  type               HospitalType
  locationId         String

  phone              String?
  email              String?
  website            String?
  openingHours       String?
  emergencyAvailable Boolean      @default(false)
  servicesSummary    String?
  verified           Boolean      @default(false)

  location           Location     @relation(fields: [locationId], references: [id], onDelete: Restrict)

  doctors            DoctorHospital[]
  tags               HospitalTag[]
  services           HospitalService[]
  media              HospitalMedia[]
  bookings           Booking[]
  availabilitySlots  AvailabilitySlot[] // optional: if you attach slots to hospital too

  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt

  @@index([locationId])
  @@index([name])
}

/* =========================
   PROVIDERS: DOCTORS
========================= */

model Doctor {
  id                String   @id @default(cuid())
  fullName          String
  gender            String?
  experienceYears   Int
  education         String?
  bio               String?

  // Store as JSON arrays: ["English", "Nepali"] and ["ONLINE","PHYSICAL"]
  languages         Json
  consultationModes Json

  licenseNumber     String?
  feeMin            Int
  feeMax            Int
  currency          String
  verified          Boolean  @default(false)

  hospitals         DoctorHospital[]
  specialties       DoctorSpecialty[]
  tags              DoctorTag[]
  services          DoctorService[]
  availability      AvailabilitySlot[]
  media             DoctorMedia[]
  bookings          Booking[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([fullName])
  @@index([verified])
  @@index([feeMin, feeMax])
}

/* =========================
   RELATIONS (M:N)
========================= */

model DoctorSpecialty {
  doctorId    String
  specialtyId String
  isPrimary   Boolean @default(false)

  doctor      Doctor    @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  specialty   Specialty @relation(fields: [specialtyId], references: [id], onDelete: Cascade)

  @@id([doctorId, specialtyId])
  @@index([specialtyId])
}

model DoctorHospital {
  doctorId      String
  hospitalId    String
  positionTitle String?
  isPrimary     Boolean @default(false)

  doctor        Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  hospital      Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)

  @@id([doctorId, hospitalId])
  @@index([hospitalId])
}

model DoctorTag {
  doctorId String
  tagId    String

  doctor   Doctor @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  tag      Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([doctorId, tagId])
  @@index([tagId])
}

model HospitalTag {
  hospitalId String
  tagId      String

  hospital   Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)
  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([hospitalId, tagId])
  @@index([tagId])
}

/* =========================
   SERVICES & AVAILABILITY
========================= */

model DoctorService {
  id              String   @id @default(cuid())
  doctorId        String
  title           String
  price           Int
  currency        String
  durationMinutes Int
  isActive        Boolean  @default(true)

  doctor          Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([doctorId])
}

model HospitalService {
  id          String   @id @default(cuid())
  hospitalId  String
  title       String
  price       Int
  currency    String
  description String?
  isActive    Boolean  @default(true)

  hospital    Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([hospitalId])
}

model AvailabilitySlot {
  id                  String           @id @default(cuid())
  doctorId            String
  hospitalId          String?
  mode                ConsultationMode
  dayOfWeek           Int              // 0-6
  startTime           String           // "10:00"
  endTime             String           // "13:00"
  slotDurationMinutes Int
  isActive            Boolean          @default(true)

  doctor              Doctor           @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  hospital            Hospital?        @relation(fields: [hospitalId], references: [id], onDelete: SetNull)

  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  @@index([doctorId])
  @@index([hospitalId])
  @@index([dayOfWeek, mode])
}

/* =========================
   MEDIA (DONE PROPERLY)
========================= */

model DoctorMedia {
  id        String   @id @default(cuid())
  doctorId  String
  url       String
  altText   String?
  isPrimary Boolean  @default(false)

  doctor    Doctor   @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([doctorId])
}

model HospitalMedia {
  id        String   @id @default(cuid())
  hospitalId String
  url       String
  altText   String?
  isPrimary Boolean  @default(false)

  hospital  Hospital @relation(fields: [hospitalId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([hospitalId])
}

/* =========================
   BOOKING (PAYMENT-AGNOSTIC)
========================= */

model Booking {
  id                String          @id @default(cuid())
  userId            String
  patientId         String

  doctorId          String?
  hospitalId        String

  doctorServiceId   String?
  hospitalServiceId String?

  mode              ConsultationMode
  scheduledAt       DateTime
  notes             String?
  localContactName  String?
  localContactPhone String?

  status            BookingStatus   @default(DRAFT)

  user              User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  patient           Patient         @relation(fields: [patientId], references: [id], onDelete: Cascade)

  doctor            Doctor?         @relation(fields: [doctorId], references: [id], onDelete: SetNull)
  hospital          Hospital        @relation(fields: [hospitalId], references: [id], onDelete: Restrict)

  doctorService     DoctorService?  @relation(fields: [doctorServiceId], references: [id], onDelete: SetNull)
  hospitalService   HospitalService? @relation(fields: [hospitalServiceId], references: [id], onDelete: SetNull)

  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  @@index([userId])
  @@index([patientId])
  @@index([doctorId])
  @@index([hospitalId])
  @@index([status, scheduledAt])
}

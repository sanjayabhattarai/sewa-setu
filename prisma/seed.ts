import { PrismaClient, HospitalType } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanStr(s?: string | null): string | null {
  if (!s) return null;
  const t = String(s).trim();
  return t.length ? t : null;
}

async function main() {
  console.log("🌱 Seeding started...");

  // Load JSON
  const jsonPath = path.join(
    process.cwd(),
    "prisma",
    "grande_hospital.json"
  );

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const departments = JSON.parse(raw);

  // Clear existing data (safe order)
  await prisma.departmentDoctor.deleteMany();
  await prisma.doctorSpecialty.deleteMany();
  await prisma.doctorHospital.deleteMany();
  await prisma.hospitalPackage.deleteMany();
  await prisma.hospitalDepartment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.location.deleteMany();

  console.log("🧹 Old data cleared.");

  // Create Location
  const location = await prisma.location.create({
    data: {
      country: "Nepal",
      province: "Bagmati",
      district: "Kathmandu",
      city: "Kathmandu",
      area: "Dhapasi",
      addressLine: "Grande International Hospital",
    },
  });

  // Create Hospital
  const hospital = await prisma.hospital.create({
    data: {
      slug: "grande-international-hospital",
      name: "Grande International Hospital",
      type: HospitalType.HOSPITAL,
      locationId: location.id,
      emergencyAvailable: true,
      servicesSummary:
        "Grande International Hospital was created with the vision to fill an existing void in the Nepali healthcare industry. It is dedicated to the seamless delivery of quality, patient-centric healthcare which means supplying everything a patient may need, from acute critical care to rehabilitation to transitional care to home healthcare services at an affordable cost. Our goal is to establish in this country a culture of continuous improvement in healthcare not only by providing excellent healthcare services but also by conducting community health education seminars, outreach programs, and wellness programs in several parts of Nepal.\n\nThe hospital is a 200 bedded, state of the art health care facility offering a wide range of medical, surgical and diagnostic services. The hospital has special features like a Wellness Center to help our community stay healthy. With latest in technology and a network of qualified physicians and staff, Grande International Hospital is your destination for the best healthcare services the country has to offer.",
    },
  });

  console.log("🏥 Hospital created.");

  const doctorMap = new Map<string, string>();

  let deptCount = 0;
  let doctorCount = 0;

  for (const dept of departments) {
    const deptName = dept.department;
    const deptSlug = slugify(deptName);

    // Create Specialty for department
    const specialty = await prisma.specialty.create({
      data: {
        name: deptName,
        slug: deptSlug,
      },
    });

    // Create HospitalDepartment
    const hospitalDept = await prisma.hospitalDepartment.create({
      data: {
        hospitalId: hospital.id,
        specialtyId: specialty.id,
        name: deptName,
        slug: deptSlug,
        overview: cleanStr(dept.description),
        dataOrigin: "IMPORTED",
      },
    });

    deptCount++;

    let sortOrder = 0;

    for (const doc of dept.doctors || []) {
      const name = cleanStr(doc.name);
      if (!name) continue;

      let doctorId = doctorMap.get(name);

      if (!doctorId) {
        const doctor = await prisma.doctor.create({
          data: {
            fullName: name,
            education: cleanStr(doc.education),
            verified: false,
          },
        });

        doctorId = doctor.id;
        doctorMap.set(name, doctorId);
        doctorCount++;

        await prisma.doctorHospital.create({
          data: {
            doctorId,
            hospitalId: hospital.id,
            positionTitle: cleanStr(doc.designation),
            isPrimary: true,
          },
        });
      }

      // DoctorSpecialty from doctor's own specialty field
      if (doc.specialty) {
        const spSlug = slugify(doc.specialty);
        const existing = await prisma.specialty.findUnique({
          where: { slug: spSlug },
        });

        let spId;

        if (existing) {
          spId = existing.id;
        } else {
          const created = await prisma.specialty.create({
            data: {
              name: doc.specialty,
              slug: spSlug,
            },
          });
          spId = created.id;
        }

        await prisma.doctorSpecialty.upsert({
          where: {
            doctorId_specialtyId: {
              doctorId,
              specialtyId: spId,
            },
          },
          update: {},
          create: {
            doctorId,
            specialtyId: spId,
            isPrimary: true,
          },
        });
      }

      // DepartmentDoctor link
      await prisma.departmentDoctor.create({
        data: {
          departmentId: hospitalDept.id,
          doctorId,
          designation: cleanStr(doc.designation),
          education: cleanStr(doc.education),
          sortOrder,
        },
      });

      sortOrder++;
    }
  }

  console.log(`🏢 Departments: ${deptCount}`);
  console.log(`👨‍⚕️ Doctors: ${doctorCount}`);

  // Add test packages
  await prisma.hospitalPackage.createMany({
    data: [
      {
        hospitalId: hospital.id,
        title: "Basic Health Checkup",
        price: 2999,
        currency: "NPR",
        dataOrigin: "MANUAL",
      },
      {
        hospitalId: hospital.id,
        title: "Cardiac Screening Package",
        price: 5999,
        currency: "NPR",
        dataOrigin: "MANUAL",
      },
    ],
  });

  console.log("📦 Packages added.");
  console.log("✅ Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
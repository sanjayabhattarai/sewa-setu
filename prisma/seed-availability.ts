// prisma/seed-availability.ts
import { PrismaClient, ConsultationMode } from "@prisma/client";

const prisma = new PrismaClient();

const pad2 = (n: number) => String(n).padStart(2, "0");
const toTime = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function rng(seed: number) {
  let x = seed || 123456789;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17; x >>>= 0;
    x ^= x << 5;  x >>>= 0;
    return x / 0xffffffff;
  };
}

// Fixed pool: EVERY day except Saturday
const ALL_WORKING_DAYS = [0, 1, 2, 3, 4, 5]; 

const DAYTIME_PATTERNS = [
  ["08:00", "10:00", "12:00", "14:00"],
  ["09:00", "11:00", "13:00", "15:00"],
  ["10:00", "12:00", "14:00", "16:00"],
];

const ONLINE_POOL = ["17:00", "18:00", "19:00", "20:00", "21:00"];

type SlotRow = {
  doctorId: string;
  hospitalId: string;
  mode: ConsultationMode;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
};

function buildDailySlots(r: () => number) {
  const duration = 30;

  const base = DAYTIME_PATTERNS[Math.floor(r() * DAYTIME_PATTERNS.length)];

  // Pick between 1 and 3 physical slots
  const physicalCount = 1 + Math.floor(r() * 3); 
  const physicalTimes = base.slice(0, physicalCount);

  // Exactly 1 online slot
  const onlineTime = ONLINE_POOL[Math.floor(r() * ONLINE_POOL.length)];

  // Total slots will now perfectly range from 2 to 4 per day
  return { duration, physicalTimes, onlineTimes: [onlineTime] };
}

async function main() {
  console.log("🌱 Seeding strict daily slot patterns (Max 4/day)...");

  await prisma.availabilitySlot.deleteMany({});
  console.log("🧹 Cleared old availability.");

  const doctors = await prisma.doctor.findMany({
    select: {
      id: true,
      hospitals: { select: { hospitalId: true } },
    },
  });

  console.log(`👨‍⚕️ Doctors found: ${doctors.length}`);

  const rows: SlotRow[] = [];

  for (const d of doctors) {
    const hospitalIds = d.hospitals.map((h) => h.hospitalId);
    if (!hospitalIds.length) continue;

    const r = rng(hashStr(d.id));

    for (const hospitalId of hospitalIds) {
      // Loop over EVERY working day (Sun-Fri)
      for (const dayOfWeek of ALL_WORKING_DAYS) {
        
        const { duration, physicalTimes, onlineTimes } = buildDailySlots(r);

        // PHYSICAL
        for (const t of physicalTimes) {
          const st = toMin(t);
          rows.push({
            doctorId: d.id,
            hospitalId,
            mode: ConsultationMode.PHYSICAL,
            dayOfWeek,
            startTime: toTime(st),
            endTime: toTime(st + duration),
            slotDurationMinutes: duration,
            isActive: true,
          });
        }

        // ONLINE
        for (const t of onlineTimes) {
          const st = toMin(t);
          rows.push({
            doctorId: d.id,
            hospitalId,
            mode: ConsultationMode.ONLINE,
            dayOfWeek,
            startTime: toTime(st),
            endTime: toTime(st + duration),
            slotDurationMinutes: duration,
            isActive: true,
          });
        }
      }
    }
  }

  console.log(`📅 Slots to insert: ${rows.length}`);

  const res = await prisma.availabilitySlot.createMany({
    data: rows,
    skipDuplicates: true,
  });

  console.log(`✅ Inserted: ${res.count}`);
  console.log("🎉 Done.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
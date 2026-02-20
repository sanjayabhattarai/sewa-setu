// src/lib/availability.ts
export type Mode = "ONLINE" | "PHYSICAL";

export type WindowSlot = {
  id: string;
  doctorId: string;
  hospitalId: string | null;
  mode: Mode;
  dayOfWeek: number; // 0=Sun..6=Sat (Nepal uses Sunday-first, JS matches this)
  startTime: string; // "09:30"
  endTime: string;   // "11:30"
  slotDurationMinutes: number;
  isActive: boolean;
};

export type Occurrence = {
  date: string;      // YYYY-MM-DD
  dayOfWeek: number; // 0..6
  mode: Mode;
  startTime: string; // "09:30"
  endTime: string;   // "10:00"
  doctorId: string;
  windowId: string;  // link back to the AvailabilitySlot row
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function minutesToTime(min: number) {
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

// Expand one window into bookable times (occurrences) for a given date
function expandWindowToOccurrencesForDate(slot: WindowSlot, date: Date): Occurrence[] {
  const step = Math.max(slot.slotDurationMinutes, 5);
  const startMin = timeToMinutes(slot.startTime);
  const endMin = timeToMinutes(slot.endTime);

  const dateStr = formatDate(date);
  const out: Occurrence[] = [];

  for (let t = startMin; t + step <= endMin; t += step) {
    const st = minutesToTime(t);
    const en = minutesToTime(t + step);

    out.push({
      date: dateStr,
      dayOfWeek: date.getDay(),
      mode: slot.mode,
      startTime: st,
      endTime: en,
      doctorId: slot.doctorId,
      windowId: slot.id,
    });
  }

  return out;
}

/**
 * Expand weekly windows into a rolling range (3/4/7 days, etc.)
 * - Filters by doctorId if provided
 * - Keeps Nepal week logic automatically (JS: 0=Sun..6=Sat)
 */
export function buildRollingOccurrences(
  slots: WindowSlot[],
  startDate: Date,
  days: number,
  doctorId?: string
): {
  dates: Date[];
  occurrencesByDate: Record<string, Occurrence[]>;
  occurrencesByDateAndMode: Record<string, { ONLINE: Occurrence[]; PHYSICAL: Occurrence[] }>;
} {
  const active = slots
    .filter((s) => s.isActive)
    .filter((s) => (doctorId ? s.doctorId === doctorId : true));

  const dates: Date[] = [];
  const occurrencesByDate: Record<string, Occurrence[]> = {};
  const occurrencesByDateAndMode: Record<string, { ONLINE: Occurrence[]; PHYSICAL: Occurrence[] }> = {};

  const base = new Date(startDate);
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i++) {
    const d = addDays(base, i);
    dates.push(d);

    const dow = d.getDay();
    const dateStr = formatDate(d);

    const todaysWindows = active.filter((s) => s.dayOfWeek === dow);

    const occ = todaysWindows.flatMap((w) => expandWindowToOccurrencesForDate(w, d));

    // Sort times
    occ.sort((a, b) => a.startTime.localeCompare(b.startTime));

    occurrencesByDate[dateStr] = occ;

    occurrencesByDateAndMode[dateStr] = {
      ONLINE: occ.filter((x) => x.mode === "ONLINE"),
      PHYSICAL: occ.filter((x) => x.mode === "PHYSICAL"),
    };
  }

  return { dates, occurrencesByDate, occurrencesByDateAndMode };
}
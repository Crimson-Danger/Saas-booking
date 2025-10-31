import { addMinutes, areIntervalsOverlapping, differenceInMinutes, format, isAfter, isBefore, isEqual, isSameDay, max, min, parse, set } from "date-fns";

export function parseHM(hm: string) {
  const [h, m] = hm.split(":").map((n) => parseInt(n, 10));
  return { h, m };
}

export function buildDayWindow(date: Date, startHM: string, endHM: string) {
  const { h: sh, m: sm } = parseHM(startHM);
  const { h: eh, m: em } = parseHM(endHM);
  const start = set(date, { hours: sh, minutes: sm, seconds: 0, milliseconds: 0 });
  const end = set(date, { hours: eh, minutes: em, seconds: 0, milliseconds: 0 });
  return { start, end };
}

export function computeSlots(args: {
  date: Date;
  durationMinutes: number;
  dayAvailability: { startTime: string; endTime: string }[];
  timeOff: { start: Date; end: Date }[];
  busy: { start: Date; end: Date }[];
  stepMinutes?: number; // default to duration
}) {
  const step = args.stepMinutes ?? args.durationMinutes;
  const windows = args.dayAvailability.map((a) => buildDayWindow(args.date, a.startTime, a.endTime));
  const slots: Date[] = [];
  for (const w of windows) {
    let cursor = w.start;
    while (!isAfter(addMinutes(cursor, args.durationMinutes), w.end)) {
      const candidate = { start: cursor, end: addMinutes(cursor, args.durationMinutes) };
      const overlapsTimeoff = args.timeOff.some((t) => areIntervalsOverlapping(candidate, t, { inclusive: true }));
      const overlapsBusy = args.busy.some((b) => areIntervalsOverlapping(candidate, b, { inclusive: true }));
      if (!overlapsTimeoff && !overlapsBusy) {
        slots.push(cursor);
      }
      cursor = addMinutes(cursor, step);
    }
  }
  return slots;
}


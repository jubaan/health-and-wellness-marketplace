export function toMinutes(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function fromMinutesUTC(dateISO: string, minutes: number): { start: Date; end: Date } {
  const d = new Date(dateISO);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
  const s = new Date(start.getTime() + minutes * 60_000);
  return { start: s, end: s }; // end placeholder; add duration externally
}

export function overlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}


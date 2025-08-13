import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, getFreeBusy } from "@/lib/google";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const practitionerId = searchParams.get("practitionerId");
  const date = searchParams.get("date"); // YYYY-MM-DD
  if (!practitionerId || !date) return new NextResponse("Bad request", { status: 400 });

  const practitioner = await prisma.practitioner.findUnique({ where: { id: practitionerId } });
  if (!practitioner) return new NextResponse("Not found", { status: 404 });

  const day = new Date(date + "T00:00:00Z");
  const dow = day.getUTCDay();
  const rules = await prisma.availabilityRule.findMany({ where: { practitionerId, dayOfWeek: dow } });
  const appts = await prisma.appointment.findMany({ where: { practitionerId, status: "scheduled", startsAt: { gte: day, lt: new Date(day.getTime() + 24*60*60*1000) } } });
  // Google busy periods
  const accessToken = await getValidAccessToken(practitionerId);
  const busy = accessToken ? await getFreeBusy(accessToken, day.toISOString(), new Date(day.getTime() + 24*60*60*1000).toISOString()) : [];

  const slots: { start: string; end: string }[] = [];
  for (const r of rules) {
    const slot = practitioner.slotMinutes;
    const buffer = practitioner.bufferMinutes;
    for (let m = r.startMinutes; m + slot <= r.endMinutes; m += slot) {
      const start = new Date(day.getTime() + m * 60_000);
      const end = new Date(start.getTime() + slot * 60_000);
      // check overlap with appts + buffers
      const sWithBuf = new Date(start.getTime() - buffer * 60_000);
      const eWithBuf = new Date(end.getTime() + buffer * 60_000);
      const conflict = appts.some(a => sWithBuf < a.endsAt && a.startsAt < eWithBuf)
        || busy.some(b => {
          const bs = new Date(b.start);
          const be = new Date(b.end);
          return sWithBuf < be && bs < eWithBuf;
        });
      if (!conflict) slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
  }

  // TODO google free/busy check later
  return NextResponse.json({ slots });
}

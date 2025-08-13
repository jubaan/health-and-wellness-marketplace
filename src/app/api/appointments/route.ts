import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { getValidAccessToken, getFreeBusy, createCalendarEvent } from "@/lib/google";
import { notifyAppointmentBooked } from "@/lib/notify";
import { unauthorized, conflict, notFound } from "@/lib/errors";

export async function GET() {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return NextResponse.json({ appointments: [] });
  const patient = await prisma.patient.findUnique({ where: { userProfileId: profile.id } });
  const practitioner = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });

  const where: any = { status: "scheduled", startsAt: { gte: new Date() } };
  if (patient) where.patientId = patient.id;
  if (!patient && practitioner) where.practitionerId = practitioner.id;

  const appointments = await prisma.appointment.findMany({ where, orderBy: { startsAt: "asc" }, include: { practitioner: true, patient: true, company: true } });
  return NextResponse.json({ appointments });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const { practitionerId, startsAtISO } = await req.json();
  const startsAt = new Date(startsAtISO);

  let profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) profile = await prisma.userProfile.create({ data: { clerkUserId: userId, email: `${userId}@placeholder.local` } });
  let patient = await prisma.patient.findUnique({ where: { userProfileId: profile.id } });
  if (!patient) patient = await prisma.patient.create({ data: { userProfileId: profile.id } });

  const practitioner = await prisma.practitioner.findUnique({ where: { id: practitionerId } });
  if (!practitioner) return notFound("practitioner_not_found");

  const slot = practitioner.slotMinutes;
  const buffer = practitioner.bufferMinutes;
  const endsAt = new Date(startsAt.getTime() + slot * 60_000);
  const sWithBuf = new Date(startsAt.getTime() - buffer * 60_000);
  const eWithBuf = new Date(endsAt.getTime() + buffer * 60_000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      practitionerId,
      status: "scheduled",
      startsAt: { lt: eWithBuf },
      endsAt: { gt: sWithBuf },
    },
  });
  if (conflict) return conflict("slot_unavailable");

  // Also check Google FreeBusy if connected
  const accessToken = await getValidAccessToken(practitionerId);
  if (accessToken) {
    const busy = await getFreeBusy(accessToken, sWithBuf.toISOString(), eWithBuf.toISOString());
    if (busy.length > 0) return conflict("slot_unavailable_calendar");
  }

  const appt = await prisma.appointment.create({
    data: {
      practitionerId,
      patientId: patient.id,
      startsAt,
      endsAt,
      status: "scheduled",
      source: "platform",
    },
  });
  // Create Google event if connected
  if (accessToken) {
    await createCalendarEvent(accessToken, {
      summary: `Cita con ${practitioner.displayName}`,
      description: `Reserva vía plataforma` ,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });
  }
  // Fire-and-forget notifications
  notifyAppointmentBooked(appt.id).catch(console.error);
  return NextResponse.json({ appointment: appt });
}

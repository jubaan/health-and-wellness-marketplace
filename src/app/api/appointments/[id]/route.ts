import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { notifyAppointmentCanceled } from "@/lib/notify";
import { unauthorized, notFound, forbidden } from "@/lib/errors";
import { canManageAppointments } from "@/lib/authz";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { action } = await req.json();
  const id = params.id;

  const appt = await prisma.appointment.findUnique({ where: { id }, include: { practitioner: { include: { userProfile: true } }, patient: { include: { userProfile: true } } } });
  if (!appt) return notFound();

  const user = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!user) return unauthorized();
  const isPatient = appt.patient.userProfileId === user.id;
  const isPractitioner = appt.practitioner.userProfileId === user.id;
  let isDelegateAllowed = false;
  if (!isPatient && !isPractitioner) {
    isDelegateAllowed = await canManageAppointments(appt.practitionerId);
  }
  if (!isPatient && !isPractitioner && !isDelegateAllowed) return forbidden();

  if (action === "cancel") {
    await prisma.appointment.update({ where: { id }, data: { status: "canceled" } });
    notifyAppointmentCanceled(id).catch(console.error);
  }

  return NextResponse.json({ ok: true });
}

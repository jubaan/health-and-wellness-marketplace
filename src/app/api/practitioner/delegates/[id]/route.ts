import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { unauthorized, notFound, forbidden } from "@/lib/errors";
import { requireAnyRole } from "@/lib/authz";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const role = await requireAnyRole(["practitioner", "platform_admin", "platform_accounts_manager"]);
  if (role instanceof NextResponse) return role;
  const id = params.id;
  const body = await req.json();

  const delegate = await prisma.practitionerDelegate.findUnique({ where: { id }, include: { practitioner: { include: { userProfile: true } } } });
  if (!delegate) return notFound();
  if (delegate.practitioner.userProfile.clerkUserId !== userId && role !== "platform_admin" && role !== "platform_accounts_manager") return forbidden();

  const updated = await prisma.practitionerDelegate.update({ where: { id }, data: {
    canManageProfile: body.canManageProfile ?? undefined,
    canManageAvailability: body.canManageAvailability ?? undefined,
    canManageAppointments: body.canManageAppointments ?? undefined,
  }});
  return NextResponse.json({ delegate: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const role = await requireAnyRole(["practitioner", "platform_admin", "platform_accounts_manager"]);
  if (role instanceof NextResponse) return role;
  const id = params.id;

  const delegate = await prisma.practitionerDelegate.findUnique({ where: { id }, include: { practitioner: { include: { userProfile: true } } } });
  if (!delegate) return notFound();
  if (delegate.practitioner.userProfile.clerkUserId !== userId && role !== "platform_admin" && role !== "platform_accounts_manager") return forbidden();

  await prisma.practitionerDelegate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { requireAnyRole, isPractitionerOrDelegate, canManageAvailability } from "@/lib/authz";
import { unauthorized, badRequest, forbidden } from "@/lib/errors";

export async function GET() {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const role = await requireAnyRole(["practitioner", "practitioner_assistant", "platform_admin", "platform_accounts_manager"]);
  if (role instanceof NextResponse) return role;
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return NextResponse.json({ rules: [], practitioner: null });
  const practitioner = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  if (!practitioner) return NextResponse.json({ rules: [], practitioner: null });
  const rules = await prisma.availabilityRule.findMany({ where: { practitionerId: practitioner.id }, orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }] });
  return NextResponse.json({ rules, practitioner });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const role = await requireAnyRole(["practitioner", "practitioner_assistant", "platform_admin", "platform_accounts_manager"]);
  if (role instanceof NextResponse) return role;
  const body = await req.json();
  const { rules, slotMinutes, bufferMinutes, cancellationWindowHours, practitionerId } = body as any;

  let profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) profile = await prisma.userProfile.create({ data: { clerkUserId: userId, email: `${userId}@placeholder.local` } });
  let practitioner;
  if (practitionerId) {
    const allowed = await isPractitionerOrDelegate(practitionerId);
    if (!allowed) return forbidden();
    const can = await canManageAvailability(practitionerId);
    if (!can) return forbidden();
    practitioner = await prisma.practitioner.findUnique({ where: { id: practitionerId } });
  } else {
    practitioner = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  }
  if (!practitioner) return badRequest("practitioner_not_found");

  await prisma.$transaction([
    prisma.practitioner.update({ where: { id: practitioner.id }, data: { slotMinutes, bufferMinutes, cancellationWindowHours } }),
    prisma.availabilityRule.deleteMany({ where: { practitionerId: practitioner.id } }),
    prisma.availabilityRule.createMany({ data: (rules as any[]).map(r => ({ ...r, practitionerId: practitioner!.id })) }),
  ]);

  return NextResponse.json({ ok: true });
}

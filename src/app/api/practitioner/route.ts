import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { requireAnyRole, isPractitionerOrDelegate, canManageProfile } from "@/lib/authz";
import { unauthorized, badRequest, forbidden } from "@/lib/errors";

export async function GET() {
  const { userId } = auth();
  if (!userId) return unauthorized();

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return NextResponse.json({ practitioner: null });
  const practitioner = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  return NextResponse.json({ practitioner });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const role = await requireAnyRole(["practitioner", "practitioner_assistant", "platform_admin", "platform_accounts_manager"]);
  if (role instanceof NextResponse) return role;
  const body = await req.json();
  const { displayName, avatarUrl, specialties = [], tags = [], city, lat, lng, practitionerId } = body as {
    displayName: string; avatarUrl?: string; specialties?: string[]; tags?: string[]; city?: string; lat?: number; lng?: number; practitionerId?: string
  };

  let profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) {
    profile = await prisma.userProfile.create({ data: { clerkUserId: userId, email: `${userId}@placeholder.local` } });
  }

  let targetPractitionerId: string | undefined = undefined;
  if (practitionerId) {
    const allowed = await isPractitionerOrDelegate(practitionerId);
    if (!allowed) return forbidden();
    const can = await canManageProfile(practitionerId);
    if (!can) return forbidden();
    targetPractitionerId = practitionerId;
  } else {
    const existing = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
    if (existing) targetPractitionerId = existing.id;
  }

  let practitioner;
  if (targetPractitionerId) {
    practitioner = await prisma.practitioner.update({ where: { id: targetPractitionerId }, data: { displayName, avatarUrl, specialties, tags, city, lat, lng } });
  } else {
    practitioner = await prisma.practitioner.create({ data: { userProfileId: profile.id, displayName, avatarUrl, specialties, tags, city, lat, lng } });
  }

  return NextResponse.json({ practitioner });
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ actingPractitionerId: null, permissions: null });
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return NextResponse.json({ actingPractitionerId: null, permissions: null });

  const self = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  if (self) {
    return NextResponse.json({ actingPractitionerId: self.id, permissions: { canManageProfile: true, canManageAvailability: true, canManageAppointments: true } });
  }

  const delegate = await prisma.practitionerDelegate.findFirst({ where: { userProfileId: profile.id }, orderBy: { createdAt: "asc" } });
  if (delegate) {
    return NextResponse.json({ actingPractitionerId: delegate.practitionerId, permissions: {
      canManageProfile: delegate.canManageProfile,
      canManageAvailability: delegate.canManageAvailability,
      canManageAppointments: delegate.canManageAppointments,
    } });
  }

  return NextResponse.json({ actingPractitionerId: null, permissions: null });
}


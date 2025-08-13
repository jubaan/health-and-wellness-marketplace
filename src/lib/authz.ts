import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import type { PlatformRole } from "@/lib/rbac";
import { getCurrentRole } from "@/lib/rbac";
import { forbidden } from "@/lib/errors";

export async function requireAnyRole(allowed: PlatformRole[]) {
  const role = await getCurrentRole();
  if (!role || !allowed.includes(role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return role;
}

export async function isCompanyAdminFor(companyId: string) {
  const { userId } = auth();
  if (!userId) return false;
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company?.clerkOrgId) return false;
  const memberships = await clerkClient.users.getOrganizationMembershipList({ userId });
  return memberships.data?.some((m) => m.organization.id === company.clerkOrgId && m.role === "admin") || false;
}

export async function isPractitionerSelf(practitionerId: string) {
  const { userId } = auth();
  if (!userId) return false;
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return false;
  const prac = await prisma.practitioner.findUnique({ where: { id: practitionerId } });
  return prac?.userProfileId === profile.id;
}

export async function isPractitionerOrDelegate(practitionerId: string) {
  const { userId } = auth();
  if (!userId) return false;
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return false;
  const self = await prisma.practitioner.findFirst({ where: { id: practitionerId, userProfileId: profile.id } });
  if (self) return true;
  const delegate = await prisma.practitionerDelegate.findUnique({ where: { practitionerId_userProfileId: { practitionerId, userProfileId: profile.id } } });
  return !!delegate;
}

export function ensureAllowed(ok: boolean) {
  return ok ? null : forbidden();
}

export async function delegatePermissions(practitionerId: string) {
  const { userId } = auth();
  if (!userId) return null;
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return null;
  return prisma.practitionerDelegate.findUnique({ where: { practitionerId_userProfileId: { practitionerId, userProfileId: profile.id } } });
}

export async function canManageProfile(practitionerId: string) {
  const { userId } = auth();
  if (!userId) return false;
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return false;
  const self = await prisma.practitioner.findFirst({ where: { id: practitionerId, userProfileId: profile.id } });
  if (self) return true;
  const del = await delegatePermissions(practitionerId);
  return !!del?.canManageProfile;
}

export async function canManageAvailability(practitionerId: string) {
  const { userId } = auth();
  if (!userId) return false;
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return false;
  const self = await prisma.practitioner.findFirst({ where: { id: practitionerId, userProfileId: profile.id } });
  if (self) return true;
  const del = await delegatePermissions(practitionerId);
  return !!del?.canManageAvailability;
}

export async function canManageAppointments(practitionerId: string) {
  const { userId } = auth();
  if (!userId) return false;
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return false;
  const self = await prisma.practitioner.findFirst({ where: { id: practitionerId, userProfileId: profile.id } });
  if (self) return true;
  const del = await delegatePermissions(practitionerId);
  return !!del?.canManageAppointments;
}

export function forbidden() {
  return new NextResponse("Forbidden", { status: 403 });
}

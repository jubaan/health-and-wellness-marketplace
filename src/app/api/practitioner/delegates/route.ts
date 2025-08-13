import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest, forbidden } from "@/lib/errors";
import { requireAnyRole } from "@/lib/authz";

export async function GET() {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const role = await requireAnyRole(["practitioner", "platform_admin", "platform_accounts_manager"]);
  if (role instanceof NextResponse) return role;

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return NextResponse.json({ delegates: [] });
  const practitioner = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  if (!practitioner) return NextResponse.json({ delegates: [] });

  const delegates = await prisma.practitionerDelegate.findMany({
    where: { practitionerId: practitioner.id },
    include: { userProfile: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ delegates });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const role = await requireAnyRole(["practitioner", "platform_admin", "platform_accounts_manager"]);
  if (role instanceof NextResponse) return role;
  const body = await req.json();
  const { email, canManageProfile = true, canManageAvailability = true, canManageAppointments = true } = body as any;
  if (!email) return badRequest("email_required");

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return badRequest("profile_not_found");
  const practitioner = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  if (!practitioner) return badRequest("practitioner_not_found");

  // Find Clerk user by email
  const list = await clerkClient.users.getUserList({ emailAddress: [email] });
  const clerkUser = list?.data?.[0];
  if (!clerkUser) return badRequest("user_not_found");

  // Upsert UserProfile for delegate
  const delegateProfile = await prisma.userProfile.upsert({
    where: { clerkUserId: clerkUser.id },
    update: { email: clerkUser.emailAddresses?.[0]?.emailAddress || email },
    create: { clerkUserId: clerkUser.id, email: clerkUser.emailAddresses?.[0]?.emailAddress || email },
  });

  const delegate = await prisma.practitionerDelegate.upsert({
    where: { practitionerId_userProfileId: { practitionerId: practitioner.id, userProfileId: delegateProfile.id } },
    update: { canManageProfile, canManageAvailability, canManageAppointments },
    create: { practitionerId: practitioner.id, userProfileId: delegateProfile.id, canManageProfile, canManageAvailability, canManageAppointments },
  });
  return NextResponse.json({ delegate });
}


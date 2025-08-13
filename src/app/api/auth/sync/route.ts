import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  // Ensure profile
  const user = await clerkClient.users.getUser(userId);
  const email = user.emailAddresses?.[0]?.emailAddress || `${userId}@placeholder.local`;
  let profile = await prisma.userProfile.upsert({
    where: { clerkUserId: userId },
    update: { email },
    create: { clerkUserId: userId, email },
  });

  // Ensure base role resources
  const platformRole = (user.publicMetadata?.platformRole as string | undefined) || null;
  if (platformRole === "practitioner") {
    await prisma.practitioner.upsert({
      where: { userProfileId: profile.id },
      update: {},
      create: { userProfileId: profile.id, displayName: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : email.split("@")[0], specialties: [], tags: [] },
    });
  } else if (platformRole === "patient" || !platformRole) {
    await prisma.patient.upsert({ where: { userProfileId: profile.id }, update: {}, create: { userProfileId: profile.id } });
  }

  // Sync organization memberships → companies and practitioner-company memberships (if practitioner)
  const memberships = await clerkClient.users.getOrganizationMembershipList({ userId });
  const prac = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  for (const m of memberships.data || []) {
    // Upsert Company by Clerk org id
    const org = await clerkClient.organizations.getOrganization({ organizationId: m.organization.id });
    const company = await prisma.company.upsert({
      where: { clerkOrgId: org.id },
      update: { name: org.name },
      create: { clerkOrgId: org.id, name: org.name },
    });

    // If the current user is a practitioner, upsert membership
    if (prac) {
      await prisma.practitionerCompanyMembership.upsert({
        where: { practitionerId_companyId: { practitionerId: prac.id, companyId: company.id } },
        update: {},
        create: {
          practitionerId: prac.id,
          companyId: company.id,
          role: m.role === "admin" ? "company_admin" : "company_support_team",
          canViewSchedules: true,
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}


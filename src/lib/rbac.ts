import { auth, clerkClient } from "@clerk/nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type PlatformRole =
  | "platform_admin"
  | "platform_accounts_manager"
  | "company_admin"
  | "company_support_team"
  | "practitioner"
  | "practitioner_assistant"
  | "patient";

// Placeholder: in M1 we will resolve roles from DB and/or Clerk org roles.
export async function getCurrentRole(): Promise<PlatformRole | null> {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;

  // 0) If user chose an active role cookie and it's allowed, respect it
  const available = await getAvailableRoles();
  const chosen = cookies().get("active_role")?.value as PlatformRole | undefined;
  if (chosen && available.includes(chosen)) return chosen;

  // 1) Prefer platform role from claims or user metadata
  const claimRole = (sessionClaims?.role as string | undefined) as PlatformRole | undefined;
  if (claimRole) return claimRole;
  try {
    const user = await clerkClient.users.getUser(userId);
    const metaRole = (user.publicMetadata?.platformRole as string | undefined) as PlatformRole | undefined;
    if (metaRole) return metaRole;

    // 2) If member of any orgs, derive company role by membership
    const memberships = await clerkClient.users.getOrganizationMembershipList({ userId });
    const isCompanyAdmin = memberships.data?.some((m) => m.role === "admin");
    if (isCompanyAdmin) return "company_admin";
    const isCompanySupport = memberships.data && memberships.data.length > 0;
    if (isCompanySupport) return "company_support_team";
  } catch (e) {
    // ignore, fallbacks below
  }

  // 3) Fallback: env mock for local testing
  const mock = process.env.MOCK_ROLE as PlatformRole | undefined;
  if (mock) return mock;

  // 4) Default to patient
  return "patient";
}

export async function getAvailableRoles(): Promise<PlatformRole[]> {
  const roles = new Set<PlatformRole>();
  const { userId } = auth();
  if (!userId) return [];
  try {
    const user = await clerkClient.users.getUser(userId);
    const platformRole = user.publicMetadata?.platformRole as PlatformRole | undefined;
    if (platformRole === "platform_admin" || platformRole === "platform_accounts_manager") roles.add(platformRole);
    // If user indicates practitioner
    if (platformRole === "practitioner" || platformRole === "practitioner_assistant") roles.add(platformRole);

    // Company roles from org memberships
    const memberships = await clerkClient.users.getOrganizationMembershipList({ userId });
    if (memberships.data?.length) {
      roles.add("company_support_team");
      if (memberships.data.some((m) => m.role === "admin")) roles.add("company_admin");
    }

    // DB inferred roles
    const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
    if (profile) {
      const prac = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
      if (prac) roles.add("practitioner");
      const patient = await prisma.patient.findUnique({ where: { userProfileId: profile.id } });
      if (patient) roles.add("patient");
    }
  } catch (e) {
    // ignore
  }
  if (roles.size === 0) roles.add("patient");
  return Array.from(roles);
}

export function dashboardPathForRole(role: PlatformRole): string {
  switch (role) {
    case "platform_admin":
    case "platform_accounts_manager":
      return "/admin";
    case "company_admin":
    case "company_support_team":
      return "/company";
    case "practitioner":
    case "practitioner_assistant":
      return "/practitioner";
    case "patient":
      return "/patient";
    default:
      return "/";
  }
}

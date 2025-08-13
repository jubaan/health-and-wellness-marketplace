import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs";
import { isCompanyAdminFor, requireAnyRole } from "@/lib/authz";
import { unauthorized, forbidden, badRequest } from "@/lib/errors";

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  const memberships = await clerkClient.users.getOrganizationMembershipList({ userId });
  const orgIds = new Set((memberships.data || []).map((m) => m.organization.id));

  if (companyId) {
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return NextResponse.json({ company: null });
    if (company.clerkOrgId && !orgIds.has(company.clerkOrgId)) return forbidden();
    return NextResponse.json({ company });
  }

  for (const m of memberships.data || []) {
    const c = await prisma.company.findUnique({ where: { clerkOrgId: m.organization.id } });
    if (c) return NextResponse.json({ company: c });
  }
  return NextResponse.json({ company: null });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const body = await req.json();
  const { id, name, city, lat, lng } = body as { id?: string; name?: string; city?: string; lat?: number; lng?: number };

  let profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) {
    profile = await prisma.userProfile.create({ data: { clerkUserId: userId, email: `${userId}@placeholder.local` } });
  }

  if (id) {
    const can = await isCompanyAdminFor(id);
    if (!can) return forbidden();
    const company = await prisma.company.update({ where: { id }, data: { name, city, lat, lng } });
    return NextResponse.json({ company });
  }

  const allowed = await requireAnyRole(["platform_admin", "platform_accounts_manager"]);
  if (allowed instanceof NextResponse) return allowed;
  if (!name) return badRequest("name_required");
  const company = await prisma.company.create({ data: { name, city, lat, lng } });
  return NextResponse.json({ company });
}

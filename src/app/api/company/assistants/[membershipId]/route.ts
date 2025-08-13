import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest, forbidden, notFound } from "@/lib/errors";
import { isCompanyAdminFor } from "@/lib/authz";

async function getCompanyByMembership(membershipId: string) {
  const membership = await (clerkClient as any).organizationMemberships.getOrganizationMembership(membershipId);
  if (!membership) return null;
  const orgId = membership.organization.id;
  const company = await prisma.company.findFirst({ where: { clerkOrgId: orgId } });
  return company;
}

export async function PATCH(req: Request, { params }: { params: { membershipId: string } }) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { membershipId } = params;
  const { role } = await req.json() as { role: "admin" | "support" };
  if (!membershipId || !role) return badRequest("membershipId_and_role_required");

  const company = await getCompanyByMembership(membershipId);
  if (!company) return notFound("company_not_found");
  const can = await isCompanyAdminFor(company.id);
  if (!can) return forbidden();

  await (clerkClient as any).organizationMemberships.updateOrganizationMembership(membershipId, { role: role === "admin" ? "admin" : "basic_member" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { membershipId: string } }) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { membershipId } = params;
  if (!membershipId) return badRequest("membershipId_required");

  const company = await getCompanyByMembership(membershipId);
  if (!company) return notFound("company_not_found");
  const can = await isCompanyAdminFor(company.id);
  if (!can) return forbidden();

  await (clerkClient as any).organizationMemberships.deleteOrganizationMembership(membershipId);
  return NextResponse.json({ ok: true });
}


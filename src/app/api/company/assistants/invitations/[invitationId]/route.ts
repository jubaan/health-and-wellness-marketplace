import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest, forbidden, notFound } from "@/lib/errors";
import { isCompanyAdminFor } from "@/lib/authz";

export async function PATCH(req: Request, { params }: { params: { invitationId: string } }) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return badRequest("companyId_required");
  const can = await isCompanyAdminFor(companyId);
  if (!can) return forbidden();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company?.clerkOrgId) return notFound("company_not_found");

  const invitationId = params.invitationId;
  const orgApi: any = (clerkClient as any).organizations;
  if (typeof orgApi.resendOrganizationInvitation !== "function") {
    return NextResponse.json({ error: { code: "not_implemented", message: "Resend not supported by Clerk SDK" } }, { status: 501 });
  }
  await orgApi.resendOrganizationInvitation({ organizationId: company.clerkOrgId, invitationId });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { invitationId: string } }) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return badRequest("companyId_required");
  const can = await isCompanyAdminFor(companyId);
  if (!can) return forbidden();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company?.clerkOrgId) return notFound("company_not_found");

  const invitationId = params.invitationId;
  const orgApi: any = (clerkClient as any).organizations;
  if (typeof orgApi.revokeOrganizationInvitation !== "function") {
    return NextResponse.json({ error: { code: "not_implemented", message: "Revoke not supported by Clerk SDK" } }, { status: 501 });
  }
  await orgApi.revokeOrganizationInvitation({ organizationId: company.clerkOrgId, invitationId });
  return NextResponse.json({ ok: true });
}


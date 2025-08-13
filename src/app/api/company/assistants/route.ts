import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { unauthorized, badRequest, forbidden } from "@/lib/errors";
import { isCompanyAdminFor } from "@/lib/authz";

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId");
  if (!companyId) return badRequest("companyId_required");
  const can = await isCompanyAdminFor(companyId);
  if (!can) return forbidden();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company?.clerkOrgId) return badRequest("company_without_org");

  const list = await (clerkClient as any).organizations.getOrganizationMembershipList({ organizationId: company.clerkOrgId });
  const invitesList = await (clerkClient as any).organizations.getOrganizationInvitationList?.({ organizationId: company.clerkOrgId }) || { data: [] };
  const members = (list?.data || []).map((m: any) => ({
    id: m.id,
    role: m.role,
    userId: m.publicUserData?.userId,
    email: m.publicUserData?.emailAddress,
    name: [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(" "),
    avatarUrl: m.publicUserData?.imageUrl,
    status: "active",
  }));
  const invites = (invitesList?.data || []).map((i: any) => ({
    id: i.id,
    email: i.emailAddress,
    role: i.role,
    status: i.status || "pending",
  }));
  return NextResponse.json({ members, invites });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const body = await req.json();
  const { companyId, email, role } = body as { companyId: string; email: string; role: "admin" | "support" };
  if (!companyId || !email) return badRequest("companyId_and_email_required");
  const can = await isCompanyAdminFor(companyId);
  if (!can) return forbidden();
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company?.clerkOrgId) return badRequest("company_without_org");

  await (clerkClient as any).organizations.createOrganizationInvitation({
    organizationId: company.clerkOrgId,
    emailAddress: email,
    role: role === "admin" ? "admin" : "basic_member",
  });
  return NextResponse.json({ ok: true });
}

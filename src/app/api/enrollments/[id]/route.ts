import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { isCompanyAdminFor } from "@/lib/authz";
import { forbidden, notFound, unauthorized } from "@/lib/errors";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return unauthorized();

  const { id } = params;
  const body = await _req.json();
  const { action } = body as { action: "approve" | "reject" };

  const reqRow = await prisma.enrollmentRequest.findUnique({ where: { id } });
  if (!reqRow) return notFound();

  // Only company admin for the target company can approve/reject
  const canAdmin = await isCompanyAdminFor(reqRow.companyId);
  if (!canAdmin) return forbidden();

  if (action === "approve") {
    // Approve: create or upsert membership with permissions
    await prisma.$transaction([
      prisma.enrollmentRequest.update({ where: { id }, data: { status: "approved" } }),
      prisma.practitionerCompanyMembership.upsert({
        where: { practitionerId_companyId: { practitionerId: reqRow.practitionerId, companyId: reqRow.companyId } },
        update: { canManageCalendar: reqRow.canManageCalendar, canViewSchedules: reqRow.canViewSchedules },
        create: {
          practitionerId: reqRow.practitionerId,
          companyId: reqRow.companyId,
          role: "company_support_team",
          canManageCalendar: reqRow.canManageCalendar,
          canViewSchedules: reqRow.canViewSchedules,
        },
      }),
    ]);
  } else if (action === "reject") {
    await prisma.enrollmentRequest.update({ where: { id }, data: { status: "rejected" } });
  }

  return NextResponse.json({ ok: true });
}

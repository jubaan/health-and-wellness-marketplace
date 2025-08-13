import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";
import { isCompanyAdminFor } from "@/lib/authz";
import { unauthorized, badRequest, forbidden } from "@/lib/errors";

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const companyId = searchParams.get("companyId") ?? undefined;

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return NextResponse.json({ enrollments: [] });

  // Company admin view
  if (companyId && (await isCompanyAdminFor(companyId))) {
    const where: any = { companyId };
    if (status) where.status = status as any;
    const enrollments = await prisma.enrollmentRequest.findMany({
      where,
      include: { company: true, practitioner: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ enrollments });
  }

  // Practitioner view
  const prac = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  const where: any = {};
  if (status) where.status = status as any;
  if (prac) where.practitionerId = prac.id;
  const enrollments = await prisma.enrollmentRequest.findMany({
    where,
    include: { company: true, practitioner: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ enrollments });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return unauthorized();
  const { companyId, practitionerId, note, canManageCalendar = false, canViewSchedules = true } = await req.json();

  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return badRequest("profile_not_found");

  // Determine initiator by which id is missing
  let initiatedBy: "practitioner" | "company";
  let pracId = practitionerId as string | undefined;
  if (!pracId) {
    const prac = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
    if (!prac) return badRequest("practitioner_not_found");
    pracId = prac.id;
    initiatedBy = "practitioner";
  } else {
    initiatedBy = "company";
    const isAdmin = await isCompanyAdminFor(companyId);
    if (!isAdmin) return forbidden();
  }

  const reqRow = await prisma.enrollmentRequest.create({
    data: { companyId, practitionerId: pracId!, initiatedBy, note, canManageCalendar, canViewSchedules },
  });
  return NextResponse.json({ enrollment: reqRow });
}

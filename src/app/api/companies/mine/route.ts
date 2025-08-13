import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ companies: [] });

  const memberships = await clerkClient.users.getOrganizationMembershipList({ userId });
  const companies: { id: string; name: string }[] = [];
  for (const m of memberships.data || []) {
    const orgId = m.organization.id;
    const orgName = (m.organization as any).name || "Company";
    const c = await prisma.company.upsert({
      where: { clerkOrgId: orgId },
      update: { name: orgName },
      create: { clerkOrgId: orgId, name: orgName },
    });
    companies.push({ id: c.id, name: c.name });
  }
  return NextResponse.json({ companies });
}


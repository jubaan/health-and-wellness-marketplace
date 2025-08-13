import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return NextResponse.json({ connected: false });
  const practitioner = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  if (!practitioner) return NextResponse.json({ connected: false });
  const conn = await prisma.oAuthConnection.findUnique({ where: { practitionerId_provider: { practitionerId: practitioner.id, provider: "google" } } });
  return NextResponse.json({ connected: !!(conn && conn.connected) });
}


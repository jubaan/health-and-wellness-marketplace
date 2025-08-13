import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";

export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  let profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) profile = await prisma.userProfile.create({ data: { clerkUserId: userId, email: `${userId}@placeholder.local` } });
  let prefs = await prisma.notificationPreference.findUnique({ where: { userProfileId: profile.id } });
  if (!prefs) prefs = await prisma.notificationPreference.create({ data: { userProfileId: profile.id } });
  return NextResponse.json({ preferences: prefs });
}

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  let profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) profile = await prisma.userProfile.create({ data: { clerkUserId: userId, email: `${userId}@placeholder.local` } });
  const body = await req.json();
  const data: any = {};
  const keys = [
    "emailEnabled","whatsappEnabled","smsEnabled",
    "onBooking","onReschedule","onCancel","onReminder","onInvitation",
    "whatsappNumber","phoneNumber"
  ];
  for (const k of keys) if (k in body) data[k] = body[k];
  const prefs = await prisma.notificationPreference.upsert({ where: { userProfileId: profile.id }, update: data, create: { userProfileId: profile.id, ...data } });
  return NextResponse.json({ preferences: prefs });
}


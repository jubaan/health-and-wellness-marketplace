import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs";

export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });
  const profile = await prisma.userProfile.findUnique({ where: { clerkUserId: userId } });
  if (!profile) return new NextResponse("Profile not found", { status: 400 });
  const practitioner = await prisma.practitioner.findUnique({ where: { userProfileId: profile.id } });
  if (!practitioner) return new NextResponse("Practitioner not found", { status: 400 });

  const url = new URL(req.url);
  const base = `${url.protocol}//${url.host}`;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${base}/api/google/oauth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    include_granted_scopes: "true",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ].join(" "),
    prompt: "consent",
    state: practitioner.id,
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}


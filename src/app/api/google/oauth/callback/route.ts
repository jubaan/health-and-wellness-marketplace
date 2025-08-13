import { NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) return new NextResponse("Bad request", { status: 400 });

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${origin}/api/google/oauth/callback`;
  const token = await exchangeCodeForTokens(code, redirectUri);
  const expiresAt = new Date(Date.now() + (token.expires_in - 60) * 1000);

  await prisma.oAuthConnection.upsert({
    where: { practitionerId_provider: { practitionerId: state, provider: "google" } },
    update: { accessToken: token.access_token, refreshToken: token.refresh_token ?? undefined, expiresAt, connected: true },
    create: { practitionerId: state, provider: "google", accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt, connected: true },
  });

  return NextResponse.redirect("/practitioner/calendar");
}


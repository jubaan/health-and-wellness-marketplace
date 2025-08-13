import { prisma } from "@/lib/prisma";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const client_id = process.env.GOOGLE_CLIENT_ID!;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET!;
  const params = new URLSearchParams();
  params.set("code", code);
  params.set("client_id", client_id);
  params.set("client_secret", client_secret);
  params.set("redirect_uri", redirectUri);
  params.set("grant_type", "authorization_code");
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

export async function refreshAccessToken(practitionerId: string) {
  const conn = await prisma.oAuthConnection.findUnique({ where: { practitionerId_provider: { practitionerId, provider: "google" } } });
  if (!conn?.refreshToken) return null;
  const params = new URLSearchParams();
  params.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  params.set("client_secret", process.env.GOOGLE_CLIENT_SECRET!);
  params.set("refresh_token", conn.refreshToken);
  params.set("grant_type", "refresh_token");
  const res = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: params });
  if (!res.ok) {
    console.error("Refresh token failed", await res.text());
    return null;
  }
  const data = (await res.json()) as TokenResponse;
  const expiresAt = new Date(Date.now() + (data.expires_in - 60) * 1000);
  const updated = await prisma.oAuthConnection.update({
    where: { id: conn.id },
    data: { accessToken: data.access_token, expiresAt, connected: true },
  });
  return updated.accessToken;
}

export async function getValidAccessToken(practitionerId: string) {
  const conn = await prisma.oAuthConnection.findUnique({ where: { practitionerId_provider: { practitionerId, provider: "google" } } });
  if (!conn || !conn.connected) return null;
  if (conn.accessToken && conn.expiresAt && conn.expiresAt.getTime() > Date.now() + 60 * 1000) {
    return conn.accessToken;
  }
  return await refreshAccessToken(practitionerId);
}

export async function getFreeBusy(accessToken: string, timeMinISO: string, timeMaxISO: string) {
  const body = {
    timeMin: timeMinISO,
    timeMax: timeMaxISO,
    items: [{ id: "primary" }],
  };
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`freeBusy failed: ${await res.text()}`);
  const data = await res.json();
  const cal = data.calendars?.primary;
  return (cal?.busy as { start: string; end: string }[]) || [];
}

export async function createCalendarEvent(accessToken: string, params: {
  summary: string; description?: string; startsAt: string; endsAt: string;
}) {
  const body = {
    summary: params.summary,
    description: params.description,
    start: { dateTime: params.startsAt },
    end: { dateTime: params.endsAt },
  };
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("createEvent failed", await res.text());
  }
}


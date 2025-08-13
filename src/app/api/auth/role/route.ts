import { NextResponse } from "next/server";
import { getAvailableRoles } from "@/lib/rbac";
import { auth, clerkClient } from "@clerk/nextjs";

export async function POST(req: Request) {
  const { role } = await req.json();
  const available = await getAvailableRoles();
  if (!available.includes(role)) return new NextResponse("Forbidden", { status: 403 });
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set("active_role", role, { httpOnly: false, sameSite: "lax", path: "/" });
  // Persist into session publicMetadata for SSR consistency
  const { sessionId } = auth();
  if (sessionId) {
    try { await clerkClient.sessions.updateSession(sessionId, { publicMetadata: { role } }); } catch {}
  }
  return res;
}

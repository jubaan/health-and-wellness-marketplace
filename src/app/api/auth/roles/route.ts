import { NextResponse } from "next/server";
import { getAvailableRoles, getCurrentRole } from "@/lib/rbac";

export async function GET() {
  const available = await getAvailableRoles();
  const active = await getCurrentRole();
  return NextResponse.json({ available, active });
}


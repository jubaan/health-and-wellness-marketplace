import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderFor } from "@/lib/notify";
import { getCurrentRole } from "@/lib/rbac";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const header = (req.headers as any).get?.("x-cron-secret") || (req as any).headers?.get?.("x-cron-secret");
    if (header !== cronSecret) return new NextResponse("Forbidden", { status: 403 });
  } else {
    const role = await getCurrentRole();
    if (role !== "platform_admin") return new NextResponse("Forbidden", { status: 403 });
  }
  const windowMin = parseInt(searchParams.get("windowMin") || "15");
  const now = new Date();

  const types: { type: "H24" | "H1"; offsetH: number }[] = [
    { type: "H24", offsetH: 24 },
    { type: "H1", offsetH: 1 },
  ];

  let sentCount = 0;
  for (const t of types) {
    const start = new Date(now.getTime() + t.offsetH * 60 * 60 * 1000);
    const end = new Date(start.getTime() + windowMin * 60 * 1000);
    const appts = await prisma.appointment.findMany({ where: { status: "scheduled", startsAt: { gte: start, lt: end } } });
    for (const a of appts) {
      await sendReminderFor(a.id, t.type);
      sentCount++;
    }
  }

  return NextResponse.json({ ok: true, sent: sentCount });
}

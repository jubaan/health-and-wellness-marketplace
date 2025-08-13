import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs", () => ({ auth: () => ({ userId: "u_1" }), clerkClient: { sessions: { updateSession: vi.fn() } } }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  userProfile: { findUnique: vi.fn(), create: vi.fn(), upsert: vi.fn() },
  practitioner: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  practitionerDelegate: { findUnique: vi.fn() },
  appointment: { findUnique: vi.fn(), update: vi.fn() },
} }));

import * as authz from "@/lib/authz";
import { POST as updateAvailability } from "@/app/api/availability/route";
import { POST as updatePractitioner } from "@/app/api/practitioner/route";
import { PATCH as cancelAppointment } from "@/app/api/appointments/[id]/route";
import { prisma } from "@/lib/prisma" as any;

describe("route permission enforcement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prisma.prisma.userProfile.findUnique.mockResolvedValue({ id: "p1", clerkUserId: "u_1", email: "a@b.com" });
  });

  it("availability POST forbids when delegate lacks canManageAvailability", async () => {
    vi.spyOn(authz, "requireAnyRole").mockResolvedValue("practitioner_assistant" as any);
    vi.spyOn(authz, "isPractitionerOrDelegate").mockResolvedValue(true);
    vi.spyOn(authz, "canManageAvailability").mockResolvedValue(false);
    const req = new Request("http://test/api/availability", { method: "POST", body: JSON.stringify({ practitionerId: "prac_1", rules: [], slotMinutes: 30, bufferMinutes: 10, cancellationWindowHours: 24 }) });
    const res: any = await updateAvailability(req as any);
    expect(res.status).toBe(403);
  });

  it("practitioner POST forbids when delegate lacks canManageProfile", async () => {
    vi.spyOn(authz, "requireAnyRole").mockResolvedValue("practitioner_assistant" as any);
    vi.spyOn(authz, "isPractitionerOrDelegate").mockResolvedValue(true);
    vi.spyOn(authz, "canManageProfile").mockResolvedValue(false);
    const req = new Request("http://test/api/practitioner", { method: "POST", body: JSON.stringify({ practitionerId: "prac_1", displayName: "Doc", specialties: [], tags: [] }) });
    const res: any = await updatePractitioner(req as any);
    expect(res.status).toBe(403);
  });

  it("appointment cancel allows delegate with permission", async () => {
    vi.spyOn(authz, "canManageAppointments").mockResolvedValue(true);
    prisma.prisma.appointment.findUnique.mockResolvedValue({ id: "a1", practitionerId: "prac_1", startsAt: new Date(), endsAt: new Date(), patient: { userProfileId: "p_other" }, practitioner: { userProfile: { id: "p_other2" } } });
    const req = new Request("http://test/api/appointments/a1", { method: "PATCH", body: JSON.stringify({ action: "cancel" }) });
    const res: any = await cancelAppointment(req as any, { params: { id: "a1" } } as any);
    expect(res.status).toBe(200);
  });
});


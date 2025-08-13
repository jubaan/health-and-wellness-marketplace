import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/rbac", () => ({ getCurrentRole: vi.fn() }));
vi.mock("@clerk/nextjs", () => ({ auth: () => ({ userId: "u_1" }), clerkClient: { users: { getOrganizationMembershipList: vi.fn() } } }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  company: { findUnique: vi.fn() },
  userProfile: { findUnique: vi.fn() },
  practitioner: { findUnique: vi.fn(), findFirst: vi.fn() },
  practitionerDelegate: { findUnique: vi.fn() },
} }));

import { requireAnyRole, isCompanyAdminFor, isPractitionerOrDelegate } from "@/lib/authz";
import { getCurrentRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma" as any;
import { clerkClient } from "@clerk/nextjs" as any;

describe("authz helpers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("requireAnyRole returns role when allowed", async () => {
    (getCurrentRole as any).mockResolvedValue("practitioner");
    const out: any = await requireAnyRole(["practitioner", "patient"]);
    expect(out).toBe("practitioner");
  });

  it("requireAnyRole returns NextResponse when forbidden", async () => {
    (getCurrentRole as any).mockResolvedValue("patient");
    const out: any = await requireAnyRole(["practitioner"]);
    expect(out).toHaveProperty("status", 403);
  });

  it("isCompanyAdminFor true when user is admin of org", async () => {
    prisma.prisma.company.findUnique.mockResolvedValue({ id: "c1", clerkOrgId: "org_1" });
    clerkClient.users.getOrganizationMembershipList.mockResolvedValue({ data: [{ organization: { id: "org_1" }, role: "admin" }] });
    const ok = await isCompanyAdminFor("c1");
    expect(ok).toBe(true);
  });

  it("isPractitionerOrDelegate true when self", async () => {
    prisma.prisma.userProfile.findUnique.mockResolvedValue({ id: "p1" });
    prisma.prisma.practitioner.findFirst.mockResolvedValue({ id: "prac_1", userProfileId: "p1" });
    const ok = await isPractitionerOrDelegate("prac_1");
    expect(ok).toBe(true);
  });

  it("isPractitionerOrDelegate true when delegate", async () => {
    prisma.prisma.userProfile.findUnique.mockResolvedValue({ id: "p2" });
    prisma.prisma.practitioner.findFirst.mockResolvedValue(null);
    prisma.prisma.practitionerDelegate.findUnique.mockResolvedValue({ id: "d1" });
    const ok = await isPractitionerOrDelegate("prac_2");
    expect(ok).toBe(true);
  });
});


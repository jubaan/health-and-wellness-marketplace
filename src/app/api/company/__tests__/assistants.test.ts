import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  auth: () => ({ userId: "u_1" }),
  clerkClient: {
    organizations: {
      getOrganizationMembershipList: vi.fn(),
      createOrganizationInvitation: vi.fn(),
    },
    getOrganizationInvitationList: vi.fn(),
    organizationMemberships: {
      getOrganizationMembership: vi.fn(),
      updateOrganizationMembership: vi.fn(),
      deleteOrganizationMembership: vi.fn(),
    },
  },
}));

vi.mock("@/lib/authz", () => ({ isCompanyAdminFor: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  company: { findUnique: vi.fn(), findFirst: vi.fn() },
} }));

import { GET as listAssistants, POST as inviteAssistant } from "@/app/api/company/assistants/route";
import { PATCH as updateMembership, DELETE as removeMembership } from "@/app/api/company/assistants/[membershipId]/route";
import { prisma } from "@/lib/prisma" as any;
import { clerkClient } from "@clerk/nextjs" as any;
import { isCompanyAdminFor } from "@/lib/authz" as any;

describe("company assistants endpoints", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prisma.prisma.company.findUnique.mockResolvedValue({ id: "c1", clerkOrgId: "org_1", name: "Acme" });
    prisma.prisma.company.findFirst.mockResolvedValue({ id: "c1", clerkOrgId: "org_1", name: "Acme" });
  });

  it("forbids listing when not admin", async () => {
    isCompanyAdminFor.mockResolvedValue(false);
    const req = new Request("http://test/api/company/assistants?companyId=c1");
    const res: any = await listAssistants(req as any);
    expect(res.status).toBe(403);
  });

  it("lists members and invites when admin", async () => {
    isCompanyAdminFor.mockResolvedValue(true);
    clerkClient.organizations.getOrganizationMembershipList.mockResolvedValue({ data: [ { id: "mem_1", role: "basic_member", publicUserData: { userId: "u_2", emailAddress: "x@y.com" } } ] });
    clerkClient.organizations.getOrganizationInvitationList.mockResolvedValue({ data: [ { id: "inv_1", emailAddress: "p@q.com", role: "basic_member", status: "pending" } ] });
    const req = new Request("http://test/api/company/assistants?companyId=c1");
    const res: any = await listAssistants(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.members[0].email).toBe("x@y.com");
    expect(body.invites[0].email).toBe("p@q.com");
  });

  it("invites assistant when admin", async () => {
    isCompanyAdminFor.mockResolvedValue(true);
    clerkClient.organizations.createOrganizationInvitation.mockResolvedValue({});
    const req = new Request("http://test/api/company/assistants", { method: "POST", body: JSON.stringify({ companyId: "c1", email: "x@y.com", role: "support" }) });
    const res: any = await inviteAssistant(req as any);
    expect(res.status).toBe(200);
  });

  it("updates membership role when admin", async () => {
    isCompanyAdminFor.mockResolvedValue(true);
    clerkClient.organizationMemberships.getOrganizationMembership.mockResolvedValue({ organization: { id: "org_1" } });
    const req = new Request("http://test/api/company/assistants/mem_1", { method: "PATCH", body: JSON.stringify({ role: "admin" }) });
    const res: any = await updateMembership(req as any, { params: { membershipId: "mem_1" } } as any);
    expect(res.status).toBe(200);
  });

  it("removes membership when admin", async () => {
    isCompanyAdminFor.mockResolvedValue(true);
    clerkClient.organizationMemberships.getOrganizationMembership.mockResolvedValue({ organization: { id: "org_1" } });
    const req = new Request("http://test/api/company/assistants/mem_1", { method: "DELETE" });
    const res: any = await removeMembership(req as any, { params: { membershipId: "mem_1" } } as any);
    expect(res.status).toBe(200);
  });
});

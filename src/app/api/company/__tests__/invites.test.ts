import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  auth: () => ({ userId: "u_1" }),
  clerkClient: {
    organizations: {
      resendOrganizationInvitation: vi.fn(),
      revokeOrganizationInvitation: vi.fn(),
    },
  },
}));

vi.mock("@/lib/authz", () => ({ isCompanyAdminFor: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { company: { findUnique: vi.fn() } } }));

import { PATCH as resendInvite, DELETE as revokeInvite } from "@/app/api/company/assistants/invitations/[invitationId]/route";
import { prisma } from "@/lib/prisma" as any;
import { clerkClient } from "@clerk/nextjs" as any;
import { isCompanyAdminFor } from "@/lib/authz" as any;

describe("company invites endpoints", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    prisma.prisma.company.findUnique.mockResolvedValue({ id: "c1", clerkOrgId: "org_1" });
  });

  it("resend returns 200 when supported and admin", async () => {
    isCompanyAdminFor.mockResolvedValue(true);
    clerkClient.organizations.resendOrganizationInvitation.mockResolvedValue({});
    const req = new Request("http://test/api/company/assistants/invitations/inv_1?companyId=c1", { method: "PATCH" });
    const res: any = await resendInvite(req as any, { params: { invitationId: "inv_1" } } as any);
    expect(res.status).toBe(200);
  });

  it("revoke returns 200 when supported and admin", async () => {
    isCompanyAdminFor.mockResolvedValue(true);
    clerkClient.organizations.revokeOrganizationInvitation.mockResolvedValue({});
    const req = new Request("http://test/api/company/assistants/invitations/inv_2?companyId=c1", { method: "DELETE" });
    const res: any = await revokeInvite(req as any, { params: { invitationId: "inv_2" } } as any);
    expect(res.status).toBe(200);
  });
});


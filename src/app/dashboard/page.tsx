import { redirect } from "next/navigation";
import { getCurrentRole, dashboardPathForRole } from "@/lib/rbac";

export default async function DashboardRouter() {
  // Best-effort sync of roles and org memberships on entry
  await fetch(`/api/auth/sync`, { method: "POST", cache: "no-store" });
  const role = await getCurrentRole();
  if (!role) redirect("/sign-in");
  redirect(dashboardPathForRole(role));
}

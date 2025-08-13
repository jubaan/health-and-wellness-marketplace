import { Header } from "@/components/Header";
import { getCurrentRole } from "@/lib/rbac";

export default async function AdminDashboard() {
  const role = await getCurrentRole();
  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-2">Platform Dashboard</h1>
      <p className="text-gray-700">Manage users, roles, companies, and compliance settings.</p>
      <div className="text-xs text-gray-500 mb-2">Acting as: {role}</div>
      <ul className="mt-4 list-disc pl-6 text-sm text-gray-700">
        <li>User/role management (admins & accounts managers)</li>
        <li>Company oversight and assignments</li>
        <li>Audit logs</li>
      </ul>
    </main>
  );
}

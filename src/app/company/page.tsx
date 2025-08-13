import { Header } from "@/components/Header";
import { getCurrentRole } from "@/lib/rbac";
import { CompanySwitcher } from "@/components/CompanySwitcher";

export default async function CompanyDashboard() {
  const role = await getCurrentRole();
  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-2">Company Dashboard</h1>
      <p className="text-gray-700">Manage enrolled practitioners, availability, and schedules.</p>
      <div className="mb-4">
        <CompanySwitcher />
      </div>
      <ul className="mt-4 list-disc pl-6 text-sm text-gray-700">
        <li>Practitioner enrollments and permissions</li>
        <li>Availability overview and scheduled appointments</li>
        <li>Assistants management</li>
      </ul>
      <div className="mt-6 flex gap-3">
        <a className="bg-brand-600 text-white px-4 py-2 rounded" href="/company/profile">Edit Company Profile</a>
        <a className="border border-brand-600 text-brand-700 px-4 py-2 rounded" href="/company/enrollments">Review Enrollments</a>
        <a className="border border-brand-600 text-brand-700 px-4 py-2 rounded" href="/company/assistants">Assistants</a>
      </div>
    </main>
  );
}

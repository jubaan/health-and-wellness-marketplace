"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import { useSearchParams } from "next/navigation";

type Enrollment = {
  id: string;
  initiatedBy: "practitioner" | "company";
  practitioner: { id: string; displayName: string };
  company: { id: string; name: string };
  canManageCalendar: boolean;
  canViewSchedules: boolean;
};

export default function CompanyEnrollmentsPage() {
  const [items, setItems] = useState<Enrollment[]>([]);
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");

  async function load() {
    const url = new URL("/api/enrollments", window.location.origin);
    url.searchParams.set("status", "pending");
    if (companyId) url.searchParams.set("companyId", companyId);
    const res = await fetch(url.toString());
    const d = await res.json();
    setItems(d.enrollments || []);
  }

  useEffect(() => { load(); }, [companyId]);

  async function act(id: string, action: "approve" | "reject") {
    await fetch(`/api/enrollments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    await load();
  }

  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Pending Enrollments</h1>
      <div className="mb-4"><CompanySwitcher /></div>
      <div className="grid gap-3">
        {items.length === 0 && <div className="text-gray-600">No pending requests</div>}
        {items.map((e) => (
          <div key={e.id} className="border rounded p-4">
            <div className="flex items-center gap-3">
              {e.practitioner?.avatarUrl && <img src={e.practitioner.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full" />}
              <div>
                <div className="font-medium">{e.practitioner?.displayName || e.practitioner?.id}</div>
                <div className="text-sm text-gray-600">Initiated by: {e.initiatedBy}</div>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button className="bg-brand-600 text-white px-3 py-2 rounded" onClick={() => act(e.id, "approve")}>Approve</button>
              <button className="border border-gray-300 px-3 py-2 rounded" onClick={() => act(e.id, "reject")}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

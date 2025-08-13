"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import useSWR from "swr";

export default function PatientDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const { data: roleData } = useSWR("/api/auth/roles", (u) => fetch(u).then(r=>r.json()));
  async function load() {
    const res = await fetch("/api/appointments");
    const d = await res.json();
    setItems(d.appointments || []);
  }
  useEffect(() => { load(); }, []);

  async function cancel(id: string) {
    await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) });
    await load();
  }
  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-2">Patient Dashboard</h1>
      <p className="text-gray-700">View and manage your bookings and notifications.</p>
      <ul className="mt-4 list-disc pl-6 text-sm text-gray-700">
        <li>Upcoming appointments</li>
        <li>Reschedule and cancel policies</li>
        <li>Notification preferences</li>
      </ul>
      <div className="mt-6">
        <h2 className="font-medium mb-2">Upcoming appointments</h2>
        <div className="grid gap-3">
          {items.length === 0 && <div className="text-gray-600">No upcoming appointments</div>}
          {items.map((a) => (
            <div key={a.id} className="border rounded p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {a.practitioner?.avatarUrl && <img src={a.practitioner.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full" />}
                <div>
                  <div className="font-medium">{a.practitioner?.displayName || "Practitioner"}</div>
                  <div className="text-sm text-gray-600">{new Date(a.startsAt).toLocaleString()} — {new Date(a.endsAt).toLocaleTimeString()}</div>
                </div>
              </div>
              <button className="border px-3 py-1 rounded" onClick={() => cancel(a.id)}>Cancel</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

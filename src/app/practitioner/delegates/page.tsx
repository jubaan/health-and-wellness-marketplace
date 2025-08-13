"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

type Delegate = {
  id: string;
  userProfile: { id: string; email: string };
  canManageProfile: boolean;
  canManageAvailability: boolean;
  canManageAppointments: boolean;
};

export default function DelegatesPage() {
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [email, setEmail] = useState("");
  const [perm, setPerm] = useState({ profile: true, availability: true, appointments: true });

  async function load() {
    const res = await fetch("/api/practitioner/delegates");
    const d = await res.json();
    setDelegates(d.delegates || []);
  }
  useEffect(() => { load(); }, []);

  async function add() {
    await fetch("/api/practitioner/delegates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, canManageProfile: perm.profile, canManageAvailability: perm.availability, canManageAppointments: perm.appointments })
    });
    setEmail("");
    await load();
  }

  async function update(d: Delegate, patch: Partial<Delegate>) {
    await fetch(`/api/practitioner/delegates/${d.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    await load();
  }

  async function remove(d: Delegate) {
    await fetch(`/api/practitioner/delegates/${d.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Assistants & Delegates</h1>
      <p className="text-gray-700 mb-4">Grant limited access to assistants to help manage your profile, availability, and appointments.</p>
      <div className="border rounded p-4 mb-6 grid gap-3 max-w-xl">
        <div className="font-medium">Add delegate</div>
        <input className="border rounded px-3 py-2" placeholder="Assistant email" value={email} onChange={e=>setEmail(e.target.value)} />
        <div className="grid grid-cols-3 gap-3 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={perm.profile} onChange={e=>setPerm(p=>({ ...p, profile: e.target.checked }))}/> Profile</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={perm.availability} onChange={e=>setPerm(p=>({ ...p, availability: e.target.checked }))}/> Availability</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={perm.appointments} onChange={e=>setPerm(p=>({ ...p, appointments: e.target.checked }))}/> Appointments</label>
        </div>
        <button className="bg-brand-600 text-white px-4 py-2 rounded w-fit" onClick={add} disabled={!email}>Add</button>
      </div>

      <div className="grid gap-3 max-w-2xl">
        {delegates.length === 0 && <div className="text-gray-600">No delegates yet.</div>}
        {delegates.map((d) => (
          <div key={d.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{d.userProfile.email}</div>
              <div className="text-xs text-gray-500">ID: {d.userProfile.id}</div>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={d.canManageProfile} onChange={e=>update(d, { canManageProfile: e.target.checked })}/> Profile</label>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={d.canManageAvailability} onChange={e=>update(d, { canManageAvailability: e.target.checked })}/> Availability</label>
              <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={d.canManageAppointments} onChange={e=>update(d, { canManageAppointments: e.target.checked })}/> Appointments</label>
              <button className="text-red-600 text-sm" onClick={()=>remove(d)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

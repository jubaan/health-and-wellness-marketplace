"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import useSWR from "swr";

export default function PractitionerDashboard() {
  const [items, setItems] = useState<any[]>([]);
  const { data: roleData } = useSWR("/api/auth/roles", (u) => fetch(u).then(r=>r.json()));
  const { data: ctx } = useSWR("/api/practitioner/context", (u) => fetch(u).then(r=>r.json()));
  async function load() {
    const res = await fetch("/api/appointments");
    const d = await res.json();
    setItems(d.appointments || []);
  }
  useEffect(() => { load(); }, []);
  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-2">Practitioner Dashboard</h1>
      <p className="text-gray-700">Manage enrollments, calendar, and appointments.</p>
      <ul className="mt-4 list-disc pl-6 text-sm text-gray-700">
        <li>Connect Google Calendar</li>
        <li>Set working hours and buffers</li>
        <li>Appointments and reminders</li>
      </ul>
      <div className="mt-6 flex gap-3 flex-wrap items-center">
        <a className={`px-4 py-2 rounded ${ctx?.permissions?.canManageProfile !== false ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`} href={ctx?.permissions?.canManageProfile !== false ? "/practitioner/profile" : undefined} aria-disabled={ctx?.permissions?.canManageProfile === false}>Edit Profile</a>
        <a className="border border-brand-600 text-brand-700 px-4 py-2 rounded" href="/practitioner/enroll">Request Company Enrollment</a>
        <a className={`px-4 py-2 rounded border ${ctx?.permissions?.canManageAvailability !== false ? 'border-brand-600 text-brand-700' : 'border-gray-300 text-gray-400 cursor-not-allowed'}`} href={ctx?.permissions?.canManageAvailability !== false ? "/practitioner/availability" : undefined} aria-disabled={ctx?.permissions?.canManageAvailability === false}>Availability & Booking</a>
        <a className="border border-brand-600 text-brand-700 px-4 py-2 rounded" href="/practitioner/calendar">Connect Calendar</a>
        <a className="border border-brand-600 text-brand-700 px-4 py-2 rounded" href="/practitioner/delegates">Assistants & Delegates</a>
      </div>
      <div className="mt-6">
        <h2 className="font-medium mb-2">Upcoming appointments</h2>
        <div className="grid gap-3">
          {items.length === 0 && <div className="text-gray-600">No upcoming appointments</div>}
          {items.map((a) => (
            <div key={a.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{a.patient ? a.patient.id : "Patient"}</div>
                <div className="text-sm text-gray-600">{new Date(a.startsAt).toLocaleString()} — {new Date(a.endsAt).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

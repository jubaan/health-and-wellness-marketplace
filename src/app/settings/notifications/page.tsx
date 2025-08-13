"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<any>(null);

  async function load() {
    const res = await fetch("/api/notifications/preferences");
    const d = await res.json();
    setPrefs(d.preferences);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    await fetch("/api/notifications/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(prefs) });
    alert("Saved");
  }

  if (!prefs) return <div className="container py-10">Loading...</div>;
  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Notification Preferences</h1>
      <div className="grid gap-4 max-w-xl">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.emailEnabled} onChange={e=>setPrefs({ ...prefs, emailEnabled: e.target.checked })}/> Email</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.whatsappEnabled} onChange={e=>setPrefs({ ...prefs, whatsappEnabled: e.target.checked })}/> WhatsApp</label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="WhatsApp E.164 (e.g., +52155...)" value={prefs.whatsappNumber || ""} onChange={e=>setPrefs({ ...prefs, whatsappNumber: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="Phone (optional)" value={prefs.phoneNumber || ""} onChange={e=>setPrefs({ ...prefs, phoneNumber: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.onBooking} onChange={e=>setPrefs({ ...prefs, onBooking: e.target.checked })}/> Booking</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.onCancel} onChange={e=>setPrefs({ ...prefs, onCancel: e.target.checked })}/> Cancellation</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.onReminder} onChange={e=>setPrefs({ ...prefs, onReminder: e.target.checked })}/> Reminders</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.onInvitation} onChange={e=>setPrefs({ ...prefs, onInvitation: e.target.checked })}/> Invitations</label>
        </div>
        <div>
          <button className="bg-brand-600 text-white px-4 py-2 rounded" onClick={save}>Save</button>
        </div>
      </div>
    </main>
  );
}


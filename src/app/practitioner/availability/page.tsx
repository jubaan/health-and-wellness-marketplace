"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import useSWR from "swr";

type Rule = { dayOfWeek: number; startMinutes: number; endMinutes: number };

export default function AvailabilityPage() {
  const { data: ctx } = useSWR("/api/practitioner/context", (u) => fetch(u).then(r=>r.json()));
  const [rules, setRules] = useState<Rule[]>([]);
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [cxlHours, setCxlHours] = useState(24);

  useEffect(() => {
    fetch("/api/availability").then(r=>r.json()).then(d=>{
      setRules(d.rules || []);
      if (d.practitioner) {
        setSlotMinutes(d.practitioner.slotMinutes);
        setBufferMinutes(d.practitioner.bufferMinutes);
        setCxlHours(d.practitioner.cancellationWindowHours);
      }
    }).catch(()=>{});
  }, []);

  function addRule() {
    setRules(r => [...r, { dayOfWeek: 1, startMinutes: 9*60, endMinutes: 17*60 }]);
  }
  function updateRule(i: number, patch: Partial<Rule>) {
    setRules(r => r.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  }
  function removeRule(i: number) {
    setRules(r => r.filter((_, idx) => idx !== i));
  }

  async function save() {
    await fetch("/api/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules, slotMinutes, bufferMinutes, cancellationWindowHours: cxlHours, practitionerId: ctx?.actingPractitionerId })
    });
    alert("Saved");
  }

  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Availability & Booking</h1>
      <div className="grid gap-4 max-w-2xl">
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm">Slot (min)
            <input className="border rounded px-3 py-2 w-full" type="number" value={slotMinutes} onChange={e=>setSlotMinutes(parseInt(e.target.value||"0"))} />
          </label>
          <label className="text-sm">Buffer (min)
            <input className="border rounded px-3 py-2 w-full" type="number" value={bufferMinutes} onChange={e=>setBufferMinutes(parseInt(e.target.value||"0"))} />
          </label>
          <label className="text-sm">Cancel window (h)
            <input className="border rounded px-3 py-2 w-full" type="number" value={cxlHours} onChange={e=>setCxlHours(parseInt(e.target.value||"0"))} />
          </label>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Rules</div>
            <button className="border px-3 py-1 rounded" onClick={addRule}>Add</button>
          </div>
          <div className="grid gap-3">
            {rules.map((r, i) => (
              <div key={i} className="border rounded p-3 grid grid-cols-4 gap-3 items-center">
                <select className="border rounded px-2 py-2" value={r.dayOfWeek} onChange={e=>updateRule(i,{ dayOfWeek: parseInt(e.target.value) })}>
                  <option value={0}>Sun</option>
                  <option value={1}>Mon</option>
                  <option value={2}>Tue</option>
                  <option value={3}>Wed</option>
                  <option value={4}>Thu</option>
                  <option value={5}>Fri</option>
                  <option value={6}>Sat</option>
                </select>
                <input className="border rounded px-2 py-2" type="number" value={r.startMinutes} onChange={e=>updateRule(i,{ startMinutes: parseInt(e.target.value||"0") })} />
                <input className="border rounded px-2 py-2" type="number" value={r.endMinutes} onChange={e=>updateRule(i,{ endMinutes: parseInt(e.target.value||"0") })} />
                <button className="text-red-600" onClick={()=>removeRule(i)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <button className="bg-brand-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={save} disabled={ctx?.permissions?.canManageAvailability === false}>Save</button>
        </div>
      </div>
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

type Company = { id: string; name: string; city?: string };

export default function PractitionerEnrollPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    fetch("/api/companies").then(r=>r.json()).then(d=>setCompanies(d.companies || [])).catch(()=>{});
  }, []);

  async function requestEnroll(companyId: string) {
    await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, note })
    });
    alert("Enrollment requested");
  }

  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Request Enrollment</h1>
      <div className="mb-4">
        <input className="border rounded px-3 py-2 w-full" placeholder="Optional note" value={note} onChange={e=>setNote(e.target.value)} />
      </div>
      <div className="grid gap-3">
        {companies.map(c => (
          <div key={c.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-600">{c.city || ""}</div>
            </div>
            <button className="bg-brand-600 text-white px-3 py-2 rounded" onClick={()=>requestEnroll(c.id)}>Request</button>
          </div>
        ))}
      </div>
    </main>
  );
}

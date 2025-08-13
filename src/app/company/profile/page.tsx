"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useSearchParams } from "next/navigation";

export default function CompanyProfilePage() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  useEffect(() => {
    const url = new URL("/api/company", window.location.origin);
    if (companyId) url.searchParams.set("companyId", companyId);
    fetch(url.toString()).then(r => r.json()).then(d => {
      if (d.company) {
        setName(d.company.name || "");
        setCity(d.company.city || "");
        setLat(d.company.lat?.toString() || "");
        setLng(d.company.lng?.toString() || "");
      }
    }).catch(() => {});
  }, [companyId]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/company", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: companyId || undefined, name, city, lat: lat ? Number(lat) : undefined, lng: lng ? Number(lng) : undefined })
    });
    alert("Saved");
  }

  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Company Profile</h1>
      <form className="grid gap-3 max-w-xl" onSubmit={onSave}>
        <input className="border rounded px-3 py-2" placeholder="Company name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="City" value={city} onChange={e=>setCity(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Lat" value={lat} onChange={e=>setLat(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Lng" value={lng} onChange={e=>setLng(e.target.value)} />
        </div>
        <button className="bg-brand-600 text-white px-4 py-2 rounded w-fit">Save</button>
      </form>
    </main>
  );
}

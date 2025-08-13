"use client";
import { Header } from "@/components/Header";
import { useState } from "react";

export default function SearchPage() {
  const [city, setCity] = useState("");
  const [radiusKm, setRadiusKm] = useState("10");
  const [terms, setTerms] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (radiusKm) params.set("radiusKm", radiusKm);
    if (terms) params.set("terms", terms);
    if (lat) params.set("lat", lat);
    if (lng) params.set("lng", lng);
    const res = await fetch(`/api/search/practitioners?${params.toString()}`);
    const data = await res.json();
    setResults(data.results || []);
    setLoading(false);
  }

  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Search Practitioners</h1>
      <form className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6" onSubmit={onSearch}>
        <input className="border rounded px-3 py-2" placeholder="City" value={city} onChange={(e)=>setCity(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Radius (km)" value={radiusKm} onChange={(e)=>setRadiusKm(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Diagnose/Interest (comma-separated)" value={terms} onChange={(e)=>setTerms(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Lat (optional)" value={lat} onChange={(e)=>setLat(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Lng (optional)" value={lng} onChange={(e)=>setLng(e.target.value)} />
        <button className="bg-brand-600 text-white px-4 py-2 rounded" type="submit">{loading ? "Searching..." : "Search"}</button>
      </form>
      <div className="grid gap-3">
        {results.map((p) => (
          <a key={p.id} className="border rounded p-4 hover:bg-gray-50" href={`/practitioners/${p.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {p.avatarUrl && <img src={p.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full" />}
                <div>
                  <div className="font-medium">{p.displayName}</div>
                  <div className="text-sm text-gray-600">{p.city || ""} • {(p.specialties || []).join(", ")}</div>
                </div>
              </div>
              <div className="text-right text-sm text-gray-700">
                {typeof p.ratingAverage === 'number' ? `★ ${p.ratingAverage.toFixed(1)}` : ''}
                <div className="text-xs text-gray-500">{p.distanceKm != null ? `${p.distanceKm.toFixed(1)} km` : ''}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import useSWR from "swr";

export default function PractitionerProfilePage() {
  const { data: ctx } = useSWR("/api/practitioner/context", (u) => fetch(u).then(r=>r.json()));
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [specialties, setSpecialties] = useState("");
  const [tags, setTags] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");

  useEffect(() => {
    fetch("/api/practitioner").then(r => r.json()).then(d => {
      const p = d.practitioner;
      if (p) {
        setDisplayName(p.displayName || "");
        setAvatarUrl(p.avatarUrl || "");
        setSpecialties((p.specialties || []).join(", "));
        setTags((p.tags || []).join(", "));
        setCity(p.city || "");
        setLat(p.lat?.toString() || "");
        setLng(p.lng?.toString() || "");
      }
    }).catch(() => {});
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/practitioner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        avatarUrl: avatarUrl || undefined,
        specialties: specialties.split(",").map(s=>s.trim()).filter(Boolean),
        tags: tags.split(",").map(s=>s.trim()).filter(Boolean),
        city,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        practitionerId: ctx?.actingPractitionerId,
      })
    });
    alert("Saved");
  }

  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Practitioner Profile</h1>
      <form className="grid gap-3 max-w-xl" onSubmit={onSave}>
        <input className="border rounded px-3 py-2" placeholder="Display name" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
        <div className="grid gap-2">
          <div className="flex items-center gap-3">
            {avatarUrl && <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full" />}
            <input className="border rounded px-3 py-2 flex-1" placeholder="Avatar URL (optional)" value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input type="file" accept="image/*" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const form = new FormData();
              form.append("file", file);
              setUploading(true);
              try {
                const res = await fetch("/api/uploads", { method: "POST", body: form });
                const data = await res.json();
                if (data.url) setAvatarUrl(data.url);
              } finally {
                setUploading(false);
              }
            }} />
            {uploading && <span className="text-gray-500">Uploading...</span>}
          </div>
        </div>
        <input className="border rounded px-3 py-2" placeholder="Specialties (comma-separated)" value={specialties} onChange={e=>setSpecialties(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="Tags (comma-separated)" value={tags} onChange={e=>setTags(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="City" value={city} onChange={e=>setCity(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Lat" value={lat} onChange={e=>setLat(e.target.value)} />
          <input className="border rounded px-3 py-2" placeholder="Lng" value={lng} onChange={e=>setLng(e.target.value)} />
        </div>
        <button className="bg-brand-600 text-white px-4 py-2 rounded w-fit disabled:opacity-50" disabled={ctx?.permissions?.canManageProfile === false}>Save</button>
      </form>
    </main>
  );
}

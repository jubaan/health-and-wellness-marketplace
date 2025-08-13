"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function RoleSwitcher() {
  const [available, setAvailable] = useState<string[]>([]);
  const [active, setActive] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/roles").then(r=>r.json()).then(d=>{ setAvailable(d.available || []); setActive(d.active || ""); }).catch(()=>{});
  }, []);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const role = e.target.value;
    setActive(role);
    await fetch("/api/auth/role", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    router.push("/dashboard");
  }

  if (!available.length) return null;
  return (
    <select className="border rounded px-2 py-1 text-sm" value={active} onChange={onChange} title="Switch role">
      {available.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}


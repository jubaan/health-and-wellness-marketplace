"use client";
import { useEffect, useState } from "react";

export function CompanySwitcher() {
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/companies/mine").then(r=>r.json()).then(d=>{
      setCompanies(d.companies || []);
      if (d.companies?.length) setCompanyId(d.companies[0].id);
    }).catch(()=>{});
  }, []);

  return (
    <div className="flex items-center gap-2">
      <select className="border rounded px-2 py-1 text-sm" value={companyId || ''} onChange={e=>setCompanyId(e.target.value)}>
        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <a className="border px-2 py-1 rounded text-sm" href={companyId ? `/company/profile?companyId=${companyId}` : '#'}>Profile</a>
      <a className="border px-2 py-1 rounded text-sm" href={companyId ? `/company/enrollments?companyId=${companyId}` : '#'}>Enrollments</a>
      <a className="border px-2 py-1 rounded text-sm" href={companyId ? `/company/assistants?companyId=${companyId}` : '#'}>Assistants</a>
    </div>
  );
}


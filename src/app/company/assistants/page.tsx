"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { CompanySwitcher } from "@/components/CompanySwitcher";

type Member = { id: string; email: string; role: string };

export default function CompanyAssistantsPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [members, setMembers] = useState<(Member & { name?: string; avatarUrl?: string; status?: string })[]>([]);
  const [invites, setInvites] = useState<{ id: string; email: string; role: string; status: string }[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"support" | "admin">("support");
  const searchParams = useSearchParams();

  async function loadCompanies() {
    const res = await fetch("/api/companies/mine");
    const d = await res.json();
    setCompanies(d.companies || []);
    if (!companyId && d.companies?.length) setCompanyId(d.companies[0].id);
  }
  async function loadMembers(id: string) {
    const res = await fetch(`/api/company/assistants?companyId=${id}`);
    const d = await res.json();
    setMembers(d.members || []);
    setInvites(d.invites || []);
  }
  useEffect(() => { loadCompanies(); }, []);
  useEffect(() => { const cid = searchParams.get("companyId"); if (cid) setCompanyId(cid); }, [searchParams]);
  useEffect(() => { if (companyId) loadMembers(companyId); }, [companyId]);

  async function invite() {
    if (!companyId) return;
    await fetch(`/api/company/assistants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId, email, role }) });
    setEmail("");
    await loadMembers(companyId);
  }

  async function updateRole(m: Member, newRole: "support" | "admin") {
    await fetch(`/api/company/assistants/${m.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
    if (companyId) await loadMembers(companyId);
  }

  async function remove(m: Member) {
    await fetch(`/api/company/assistants/${m.id}`, { method: "DELETE" });
    if (companyId) await loadMembers(companyId);
  }

  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-2">Company Assistants</h1>
      <p className="text-gray-700 mb-2">Invite and manage assistants for your company. Only company admins can make changes.</p>
      <div className="mb-4"><CompanySwitcher /></div>
      <div className="mb-6">
        <label className="text-sm mr-2">Company</label>
        <select className="border rounded px-3 py-2" value={companyId || ''} onChange={e => setCompanyId(e.target.value)}>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="border rounded p-4 grid gap-3 max-w-xl mb-6">
        <div className="font-medium">Invite assistant</div>
        <input className="border rounded px-3 py-2" placeholder="Assistant email" value={email} onChange={e=>setEmail(e.target.value)} />
        <select className="border rounded px-3 py-2 w-fit" value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value="support">Support</option>
          <option value="admin">Admin</option>
        </select>
        <button className="bg-brand-600 text-white px-4 py-2 rounded w-fit" onClick={invite} disabled={!email || !companyId}>Send invite</button>
      </div>

      <div className="grid gap-3 max-w-3xl">
        {members.length === 0 && invites.length === 0 && <div className="text-gray-600">No members yet.</div>}
        {invites.length > 0 && (
          <div className="border rounded p-4">
            <div className="font-medium mb-2">Pending invitations</div>
            <div className="grid gap-2">
              {invites.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{i.email}</div>
                    <div className="text-xs text-gray-500">Role: {i.role} • Status: {i.status}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="border px-2 py-1 rounded" onClick={async ()=>{ if (!companyId) return; await fetch(`/api/company/assistants/invitations/${i.id}?companyId=${companyId}`, { method: 'PATCH' }); await loadMembers(companyId); }}>Resend</button>
                    <button className="text-red-600" onClick={async ()=>{ if (!companyId) return; await fetch(`/api/company/assistants/invitations/${i.id}?companyId=${companyId}`, { method: 'DELETE' }); await loadMembers(companyId); }}>Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {members.map((m) => (
          <div key={m.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                {m.avatarUrl && <img src={m.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full" />}
                <div>
                  <div className="font-medium">{m.name || m.email}</div>
                  <div className="text-xs text-gray-500">{m.email} • Role: {m.role} • Status: {m.status || 'active'}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select className="border rounded px-2 py-1 text-sm" value={m.role === 'admin' ? 'admin' : 'support'} onChange={e=>updateRole(m, e.target.value as any)}>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
              </select>
              <button className="text-red-600 text-sm" onClick={()=>remove(m)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

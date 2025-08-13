"use client";
import { useSearchParams } from "next/navigation";
import { CompanyContextBar } from "@/components/CompanyContextBar";
import { usePlatformContext } from "@/hooks/usePlatformContext";

export function TopContext() {
  const sp = useSearchParams();
  const companyId = sp.get("companyId");
  const { role, company, loading } = usePlatformContext({ companyId });
  return (
    <div className="mb-3">
      <div className="text-xs text-gray-500">
        Acting as: <span className="font-medium text-gray-800">{role || (loading ? "…" : "—")}</span>
      </div>
      <CompanyContextBar name={company?.name} hidden={loading} />
    </div>
  );
}

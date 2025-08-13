"use client";
import useSWR from "swr";
import { useMemo } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type PlatformCompany = { id: string; name: string } | null;

export function usePlatformContext(opts?: { companyId?: string | null }) {
  const { companyId } = opts || {};

  const { data: roleData, isLoading: roleLoading } = useSWR<{ available: string[]; active: string }>(
    "/api/auth/roles",
    fetcher
  );

  const companyUrl = useMemo(() => {
    const base = "/api/company";
    if (!companyId) return base; // API will return first membership
    const u = new URL(base, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    u.searchParams.set("companyId", companyId);
    return u.pathname + u.search;
  }, [companyId]);

  const { data: companyData, isLoading: companyLoading } = useSWR<{ company: PlatformCompany }>(
    companyUrl,
    fetcher
  );

  return {
    role: roleData?.active ?? null,
    company: companyData?.company ?? null,
    loading: roleLoading || companyLoading,
  } as const;
}


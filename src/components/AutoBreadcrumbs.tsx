"use client";
import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";

function humanize(seg: string) {
  return seg
    .replace(/\[/g, "")
    .replace(/\]/g, "")
    .replace(/-/g, " ")
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1));
}

export function AutoBreadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;
  const parts = pathname.split("/").filter(Boolean);

  const items = parts.map((seg, idx) => {
    const href = "/" + parts.slice(0, idx + 1).join("/");
    const label = humanize(seg === "page" ? parts[idx - 1] : seg);
    return { label, href: idx < parts.length - 1 ? href : undefined };
  });

  return <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, ...items]} />;
}


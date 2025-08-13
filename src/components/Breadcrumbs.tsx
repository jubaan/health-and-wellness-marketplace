"use client";
import Link from "next/link";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="text-sm text-gray-600 mb-3" aria-label="Breadcrumb">
      {items.map((c, i) => (
        <span key={i}>
          {c.href ? (
            <Link href={c.href} className="hover:text-brand-700">{c.label}</Link>
          ) : (
            <span className="text-gray-800">{c.label}</span>
          )}
          {i < items.length - 1 && <span className="mx-2 text-gray-400">/</span>}
        </span>
      ))}
    </nav>
  );
}


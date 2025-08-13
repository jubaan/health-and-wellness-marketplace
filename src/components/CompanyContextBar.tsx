"use client";

export function CompanyContextBar({ name, hidden }: { name?: string | null; hidden?: boolean }) {
  if (hidden || !name) return null;
  return <div className="mb-3 text-sm text-gray-600">Company: <span className="font-medium text-gray-800">{name}</span></div>;
}

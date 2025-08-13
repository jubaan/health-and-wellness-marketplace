import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { RoleSwitcher } from "@/components/RoleSwitcher";

export function Header() {
  return (
    <header className="flex items-center justify-between mb-6">
      <Link href="/" className="text-xl font-semibold text-brand-700">CareMatch</Link>
      <nav className="flex gap-4 items-center">
        <Link href="/search" className="text-sm text-gray-700 hover:text-brand-700">Search</Link>
        <Link href="/dashboard" className="text-sm text-gray-700 hover:text-brand-700">Dashboard</Link>
        <RoleSwitcher />
        <UserButton afterSignOutUrl="/" />
      </nav>
    </header>
  );
}

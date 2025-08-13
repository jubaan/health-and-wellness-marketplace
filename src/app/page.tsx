import Link from "next/link";
import { Header } from "@/components/Header";

export default function LandingPage() {
  return (
    <main>
      <Header />
      <section className="py-16">
        <h1 className="text-4xl font-bold mb-4">Find the right practitioner, fast.</h1>
        <p className="text-gray-700 mb-8 max-w-2xl">
          A lean marketplace to match patients with healthcare and wellness practitioners by location,
          needs, and quality — with seamless booking and reminders.
        </p>
        <div className="flex gap-3">
          <Link className="bg-brand-600 text-white px-4 py-2 rounded" href="/search">Search practitioners</Link>
          <Link className="border border-brand-600 text-brand-700 px-4 py-2 rounded" href="/sign-in">Sign in</Link>
        </div>
      </section>
    </main>
  );
}


"use client";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

export default function CalendarConnectPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/google/status").then(r=>r.json()).then(d=>setConnected(!!d.connected)).catch(()=>setConnected(false));
  }, []);
  return (
    <main>
      <Header />
      <h1 className="text-2xl font-semibold mb-4">Calendar Connection</h1>
      <p className="text-gray-700 max-w-2xl mb-4">
        Connect Google Calendar to enable real-time conflict checks and automatic event creation.
      </p>
      {connected === null ? (
        <div>Checking...</div>
      ) : connected ? (
        <div className="text-green-700">Connected to Google Calendar.</div>
      ) : (
        <a className="border border-brand-600 text-brand-700 px-4 py-2 rounded" href="/api/google/oauth/start">
          Connect Google Calendar
        </a>
      )}
    </main>
  );
}

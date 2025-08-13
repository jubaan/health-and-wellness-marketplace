import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";

async function getSlots(practitionerId: string, date: string) {
  "use server";
  const res = await fetch(`/api/availability/slots?practitionerId=${practitionerId}&date=${date}`, { cache: "no-store" });
  return res.json();
}

export default async function PractitionerPublicPage({ params }: { params: { id: string } }) {
  const p = await prisma.practitioner.findUnique({ where: { id: params.id } });
  if (!p) return <div className="container py-10">Not found</div>;
  return (
    <main>
      <Header />
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold mb-2">{p.displayName}</h1>
        <div className="text-gray-600 mb-4">{p.city || ''}</div>
        <div className="mb-6">
          <div className="font-medium">Specialties</div>
          <div className="text-gray-700">{(p.specialties || []).join(", ") || '—'}</div>
        </div>
        <div className="mb-6">
          <div className="font-medium">Interests</div>
          <div className="text-gray-700">{(p.tags || []).join(", ") || '—'}</div>
        </div>
        <BookingCTA practitionerId={p.id} />
      </div>
    </main>
  );
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toUTCString().slice(17, 22); // HH:MM
}

function addDays(d: Date, n: number) { return new Date(d.getTime() + n*24*60*60*1000); }

async function Book({ practitionerId, startISO }: { practitionerId: string; startISO: string }) {
  "use server";
  await fetch(`/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ practitionerId, startsAtISO: startISO })
  });
}

function BookingCTA({ practitionerId }: { practitionerId: string }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => formatDate(addDays(today, i)));
  return (
    <div className="mt-6">
      <div className="font-medium mb-2">Book an appointment</div>
      <div className="grid gap-4">
        {days.map((d) => (
          <DaySlots key={d} practitionerId={practitionerId} date={d} />
        ))}
      </div>
    </div>
  );
}

async function DaySlots({ practitionerId, date }: { practitionerId: string; date: string }) {
  const { slots } = await getSlots(practitionerId, date);
  return (
    <div>
      <div className="text-sm text-gray-600 mb-1">{date}</div>
      <div className="flex gap-2 flex-wrap">
        {slots.length === 0 && <span className="text-xs text-gray-400">No availability</span>}
        {slots.map((s: any) => (
          <form key={s.start} action={async () => { "use server"; await Book({ practitionerId, startISO: s.start }); }}>
            <button className="border px-3 py-1 rounded text-sm hover:bg-gray-50" type="submit">{formatTime(s.start)}</button>
          </form>
        ))}
      </div>
    </div>
  );
}

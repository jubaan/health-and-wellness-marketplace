import { prisma } from "@/lib/prisma";
import { Header } from "@/components/Header";

export default async function CompanyPublicPage({ params }: { params: { id: string } }) {
  const c = await prisma.company.findUnique({ where: { id: params.id } });
  if (!c) return <div className="container py-10">Not found</div>;
  return (
    <main>
      <Header />
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold mb-2">{c.name}</h1>
        <div className="text-gray-600 mb-4">{c.city || ''}</div>
        <a href="#" className="border border-brand-600 text-brand-700 px-4 py-2 rounded">See Practitioners</a>
      </div>
    </main>
  );
}


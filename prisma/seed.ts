import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function upsertCompany(name: string, city?: string, lat?: number, lng?: number) {
  return prisma.company.upsert({
    where: { name },
    update: { city, lat, lng },
    create: { name, city, lat, lng },
  });
}

async function upsertPractitioner(
  email: string,
  displayName: string,
  opts: Partial<{ city: string; lat: number; lng: number; avatarUrl: string; specialties: string[]; tags: string[]; ratingAverage: number }>
) {
  const user = await prisma.userProfile.upsert({
    where: { clerkUserId: `seed_${email}` },
    update: { email },
    create: { clerkUserId: `seed_${email}`, email },
  });
  const existing = await prisma.practitioner.findUnique({ where: { userProfileId: user.id } });
  const data = {
    userProfileId: user.id,
    displayName,
    city: opts.city,
    lat: opts.lat,
    lng: opts.lng,
    avatarUrl: opts.avatarUrl,
    specialties: opts.specialties || [],
    tags: opts.tags || [],
    ratingAverage: opts.ratingAverage,
  };
  const practitioner = existing
    ? await prisma.practitioner.update({ where: { id: existing.id }, data })
    : await prisma.practitioner.create({ data });

  // Add weekday availability 9:00–17:00 if none
  const rules = await prisma.availabilityRule.count({ where: { practitionerId: practitioner.id } });
  if (rules === 0) {
    const entries = [1, 2, 3, 4, 5].map((dow) => ({ practitionerId: practitioner.id, dayOfWeek: dow, startMinutes: 9 * 60, endMinutes: 17 * 60 }));
    await prisma.availabilityRule.createMany({ data: entries });
  }
  return practitioner;
}

async function main() {
  console.log("Seeding minimal data...");

  // Companies
  const c1 = await upsertCompany("Clinica Centro", "CDMX", 19.4326, -99.1332);
  const c2 = await upsertCompany("Bienestar Norte", "Monterrey", 25.6866, -100.3161);

  // Practitioners (with locations and tags)
  await upsertPractitioner("ana.med@example.com", "Dra. Ana Medina", {
    city: "CDMX",
    lat: 19.43,
    lng: -99.13,
    avatarUrl: "https://i.pravatar.cc/150?img=47",
    specialties: ["cardiologia"],
    tags: ["hipertension", "bienestar"],
    ratingAverage: 4.7,
  });
  await upsertPractitioner("luis.ort@example.com", "Dr. Luis Ortega", {
    city: "Monterrey",
    lat: 25.69,
    lng: -100.31,
    avatarUrl: "https://i.pravatar.cc/150?img=12",
    specialties: ["nutricion"],
    tags: ["diabetes", "control de peso"],
    ratingAverage: 4.5,
  });
  await upsertPractitioner("sofia.psi@example.com", "Mtra. Sofía Pérez", {
    city: "Guadalajara",
    lat: 20.67,
    lng: -103.35,
    avatarUrl: "https://i.pravatar.cc/150?img=32",
    specialties: ["psicologia"],
    tags: ["ansiedad", "estrés"],
    ratingAverage: 4.8,
  });

  console.log("Seed complete ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

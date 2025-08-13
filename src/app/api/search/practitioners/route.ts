import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineKm } from "@/lib/geo";

type Query = {
  city?: string;
  lat?: string;
  lng?: string;
  radiusKm?: string;
  terms?: string; // comma separated terms for taxonomy & tags
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q: Query = {
    city: searchParams.get("city") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lng: searchParams.get("lng") ?? undefined,
    radiusKm: searchParams.get("radiusKm") ?? undefined,
    terms: searchParams.get("terms") ?? undefined,
  };

  const terms = (q.terms || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // Base candidates by city if provided (cheap filter)
  const where: any = {};
  if (q.city) where.city = { contains: q.city, mode: "insensitive" };

  // Fetch candidates
  const practitioners = await prisma.practitioner.findMany({ where });

  // Compute distance if lat/lng given
  let origin = undefined as { lat: number; lng: number } | undefined;
  const lat = q.lat ? parseFloat(q.lat) : undefined;
  const lng = q.lng ? parseFloat(q.lng) : undefined;
  const radiusKm = q.radiusKm ? parseFloat(q.radiusKm) : undefined;
  if (typeof lat === "number" && !Number.isNaN(lat) && typeof lng === "number" && !Number.isNaN(lng)) {
    origin = { lat, lng };
  }

  const enriched = practitioners
    .map((p) => {
      let distanceKm: number | null = null;
      if (origin && typeof p.lat === "number" && typeof p.lng === "number") {
        distanceKm = haversineKm(origin, { lat: p.lat, lng: p.lng });
      }

      // Tier 2: match terms to specialties and tags (OR across both)
      const specialties = (p.specialties || []).map((s) => s.toLowerCase());
      const tags = (p.tags || []).map((s) => s.toLowerCase());
      const matchesTerms = terms.length === 0 || terms.some((t) => specialties.includes(t) || tags.includes(t));

      return { ...p, distanceKm, matchesTerms };
    })
    .filter((p) => {
      const inRadius = radiusKm == null || p.distanceKm == null || p.distanceKm <= radiusKm;
      return inRadius && p.matchesTerms;
    })
    .sort((a, b) => {
      // Tier 3: sort by rating desc, then distance asc, then name
      const ra = a.ratingAverage ?? 0;
      const rb = b.ratingAverage ?? 0;
      if (rb !== ra) return rb - ra;
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return a.displayName.localeCompare(b.displayName);
    });

  return NextResponse.json({ results: enriched });
}


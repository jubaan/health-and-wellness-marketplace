# Architecture Overview

## Stack
- App: Next.js (App Router) + TypeScript
- Auth: Clerk (Users, Sessions, Organizations)
- DB: PostgreSQL + Prisma
- UI: Tailwind + small component library
- Jobs: HTTP-triggered endpoint (cron-ready)
- Integrations: Google Calendar (OAuth + FreeBusy), SendGrid, Twilio

## App Layout
- `src/app`: Routes (pages + API)
- `src/lib`: Core libs (authz, rbac, prisma, google, notify)
- `src/components`: UI components (header, role/company switchers, breadcrumbs)
- `prisma`: Schema + seed

## Data Flow (typical booking)
1. Patient searches practitioners (`/api/search/practitioners`).
2. Patient picks a slot (`/api/availability/slots`).
3. Patient books (`POST /api/appointments`).
4. System checks platform conflicts + Google FreeBusy; on success, creates DB record and Google event (if connected).
5. Notifications fire (email/WhatsApp). Reminders endpoint covers 24h/1h messages.

## Context & RBAC
- Derive available roles via Clerk user metadata + org memberships.
- Active role set via cookie + Clerk session publicMetadata; banner shows current role and selected company.
- Fine-grained rules enforced by API helpers in `src/lib/authz.ts`.

## Search Ranking (MVP)
- Tier 1: City/radius (Haversine)
- Tier 2: Specialties + tags
- Tier 3: Rating, distance, name

## Scheduling (MVP)
- Availability rules (weekday, start/end mins)
- Practitioner policy: slot length, buffers, cancel window
- Conflicts: platform appointments + Google FreeBusy


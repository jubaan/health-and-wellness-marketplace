# Health & Wellness Marketplace (MVP)

Fast MVP built with Next.js (App Router), Clerk, Prisma (PostgreSQL), and Tailwind. Includes RBAC, search, booking, Google Calendar, notifications, delegates, company assistants, and a clean UI with global context and breadcrumbs.

## Local Setup (Step‑by‑Step)
1) Prereqs
- Node.js 18+ and npm
- PostgreSQL (local) or a managed instance (Neon/Supabase)
- Clerk account (enable Organizations)
- Optional: Google Cloud project (OAuth), SendGrid, Twilio

2) Clone & install
- `npm install`

3) Environment
- `cp .env.example .env.local`
- Set these at minimum:
  - Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
  - Database: `DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public`
  - Google OAuth (for Calendar): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback`
  - Email (SendGrid): `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`
  - WhatsApp/SMS (Twilio): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`
  - Optional: `CRON_SECRET` (protect reminders endpoint)

4) Database
- Prisma client: `npm run db:generate`
- Push schema: `npm run db:push`
- Seed sample data (optional): `npm run db:seed`
  - Note: Seeded practitioner avatars use placeholder images from https://i.pravatar.cc. Replace with real photos in production.

5) Clerk config
- Create a Clerk instance; copy Publishable/Secret keys to `.env.local`.
- Enable Organizations (for companies). Create an org to test company flows.
- For quick testing, set your user `publicMetadata.platformRole` (e.g., `practitioner`, `company_admin`, `patient`). Use the header Role Switcher to change context.

6) Google Calendar (optional but recommended)
- Create OAuth credentials (Web) in Google Cloud.
- Authorized redirect URI: `http://localhost:3000/api/google/oauth/callback`
- Add Client ID/Secret to `.env.local`.

7) Run
- `npm run dev` → open `http://localhost:3000`

8) Verify key flows
- Sign in: `/sign-in` (Clerk).
- Practitioner: `/practitioner/profile` (set details, upload avatar), `/practitioner/availability`, `/practitioner/calendar` (connect Google), `/practitioner/delegates`.
- Patient: `/search` → open practitioner → book → see `/patient` and cancel.
- Company: `/company` → pick company; manage `/company/assistants` (invite/resend/revoke), review `/company/enrollments`.
- Notifications: `/settings/notifications` then book/cancel to receive emails/WhatsApp.
- Reminders: `POST /api/jobs/reminders?windowMin=60` with header `X-Cron-Secret: <CRON_SECRET>` (if set).

9) Tests
- `npm test`

## Roles (initial)
- platform_admin, platform_accounts_manager
- company_admin, company_support_team
- practitioner, practitioner_assistant
- patient

## Structure
- `src/app` — App Router pages (landing, auth, dashboards, search)
- `src/components` — UI components
- `src/lib` — helpers (RBAC, etc.)
- `prisma/schema.prisma` — DB models

## Notes
- Auth: Clerk sign-in/up is wired; protect routes via middleware.
- RBAC: `src/lib/rbac.ts` routes users to dashboards; integrate DB/claims in M1.
- Styling: Tailwind with a clean healthcare palette.
- Next steps: add company/practitioner profiles, enrollments, search tiers, booking, and notifications.

## Troubleshooting
- Prisma errors: confirm `DATABASE_URL` and run `npm run db:push`.
- Clerk org flows: ensure Organizations are enabled and your user belongs to a company org; role switcher shows available roles.
- Google OAuth redirect mismatch: update the authorized redirect URI to match `GOOGLE_REDIRECT_URI`.
- Twilio WhatsApp: use a WhatsApp-enabled number; sandbox may require joining via code.
- Uploads: local uploads are stored under `public/uploads` (for dev). For production, use S3/Supabase with signed URLs.

## M1: Profiles & Enrollments
- Practitioner profile: `/practitioner/profile` — set name, specialties, tags, location.
- Company profile: `/company/profile` — set name and location.
- Practitioner enrollment: `/practitioner/enroll` — request to join a company.
- Company approvals: `/company/enrollments` — approve/reject requests and create memberships.

API routes (for reference)
- `GET/POST /api/practitioner` — get or upsert practitioner profile.
- `GET/POST /api/company` — get or create company profile.
- `GET /api/companies` — list companies.
- `POST /api/enrollments` — create enrollment request.
- `PATCH /api/enrollments/:id` — approve/reject request.

## M2: Search & Public Profiles
- Search: `/search` supports city, radius, and terms (diagnose/interest). If lat/lng provided, results include distance and radius filter.
- API: `GET /api/search/practitioners?city=&lat=&lng=&radiusKm=&terms=` returns ranked results (rating → distance → name).
- Public pages: `/practitioners/:id` and `/companies/:id` (basic info; booking CTA placeholder).

## M3: Booking & Availability (MVP)
- Availability config (practitioner): `/practitioner/availability` — set slot, buffer, cancel window, and weekday rules.
- Slots API: `GET /api/availability/slots?practitionerId=&date=YYYY-MM-DD` — returns open slots (UTC ISO).
- Book: From `/practitioners/:id`, pick a slot to create an appointment.
- Appointments API: `GET /api/appointments` (current user’s upcoming), `POST /api/appointments` (book), `PATCH /api/appointments/:id { action: "cancel" }`.
- Dashboards show upcoming appointments; patient can cancel.

Notes
- Times stored in UTC; client formatting uses browser locale.
- Google Calendar integration is scaffold-ready via `OAuthConnection`; FreeBusy checks will be added when credentials are available.

## M4: Notifications (Email + WhatsApp)
- Preferences: `/settings/notifications` — toggle channels (email, WhatsApp) and events (booking, cancel, reminders, invitations), set numbers.
- API: `GET/POST /api/notifications/preferences` — fetch/update current user’s preferences.
- Triggers:
  - On booking: emails/WhatsApp to patient and practitioner.
  - On cancel: emails/WhatsApp to patient and practitioner.
  - Reminders: `POST /api/jobs/reminders?windowMin=15` — sends 24h and 1h reminders within window, idempotent via log.
- Env required: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.

## Google Calendar Integration
- Connect: `/practitioner/calendar` → “Connect Google Calendar” (OAuth).
- OAuth routes: `GET /api/google/oauth/start`, `GET /api/google/oauth/callback`.
- Status: `GET /api/google/status` (connected boolean).
- Slots: `/api/availability/slots` filters out busy times from Google FreeBusy when connected.
- Booking: `/api/appointments` checks Google FreeBusy and creates a Google event on success.
- Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` (default: `http://localhost:3000/api/google/oauth/callback`).

## Role Sync (Clerk)
- Platform roles: set `platformRole` in Clerk user public metadata to one of: `platform_admin`, `platform_accounts_manager`, `company_admin`, `company_support_team`, `practitioner`, `practitioner_assistant`, `patient`.
- Organization roles: Companies are Clerk Organizations. Membership role `admin` maps to `company_admin`, others to `company_support_team`.
- Sync endpoint: `POST /api/auth/sync` ensures a `UserProfile`, creates a `Patient` or `Practitioner` as needed, upserts `Company` by `clerkOrgId`, and maintains `PractitionerCompanyMembership` for practitioner users.
- Dashboard route calls sync on access; `src/lib/rbac.ts` derives the current role from claims/metadata and org memberships.

### Role Switcher (MVP)
- UI: Header shows a role selector when multiple roles are available.
- API: `GET /api/auth/roles` lists available roles and the active role; `POST /api/auth/role` sets the active role (cookie `active_role`).
- Behavior: Dashboard routing and RBAC honor the active role if it is allowed for the user.

## AuthZ & Errors
- Centralized errors: All APIs return `{ error: { code, message } }` with proper HTTP status via helpers in `src/lib/errors.ts`.
- Fine-grained checks:
  - Company approvals require company admin membership in the target Clerk Organization.
  - Practitioner profile/availability updates allowed for the practitioner or their delegates.
  - Background jobs require `CRON_SECRET` header or platform_admin.
- Delegation: `PractitionerDelegate` supports assistants acting for specific practitioners (scoped permissions groundwork).

## Tests
- Framework: Vitest. Scripts: `npm test`.
- Location: `src/lib/__tests__/authz.test.ts` with mocks for Clerk and Prisma, covering `requireAnyRole`, `isCompanyAdminFor`, and `isPractitionerOrDelegate` logic.
- To run: install dev deps (`npm install`) and execute `npm test`.

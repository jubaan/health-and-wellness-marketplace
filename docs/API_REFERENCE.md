# API Reference (MVP)

All responses use `{ error: { code, message } }` for errors.

## Auth & Context
- `GET /api/auth/roles` → `{ available, active }`
- `POST /api/auth/role { role }` → sets active role cookie + session metadata
- `POST /api/auth/sync` → syncs profile, practitioner/patient records, companies from Clerk orgs

## Companies
- `GET /api/companies/mine` → `{ companies }`
- `GET /api/company?companyId=` → current/selected company
- `POST /api/company` → update existing with `{ id, ... }` (admin) or create new (platform)
- Assistants:
  - `GET /api/company/assistants?companyId=` → `{ members, invites }`
  - `POST /api/company/assistants { companyId, email, role }`
  - `PATCH /api/company/assistants/:membershipId { role }`
  - `DELETE /api/company/assistants/:membershipId`
  - `PATCH /api/company/assistants/invitations/:invitationId?companyId=` (resend, if supported)
  - `DELETE /api/company/assistants/invitations/:invitationId?companyId=` (revoke, if supported)

## Practitioners
- `GET/POST /api/practitioner` → own or target `practitionerId` (delegates)
- `GET /api/practitioner/context` → `{ actingPractitionerId, permissions }`
- Delegates:
  - `GET/POST /api/practitioner/delegates`
  - `PATCH/DELETE /api/practitioner/delegates/:id`

## Search & Profiles
- `GET /api/search/practitioners?city=&lat=&lng=&radiusKm=&terms=` → ranked list

## Scheduling & Appointments
- `GET/POST /api/availability` → rules and policy (delegates may target practitionerId)
- `GET /api/availability/slots?practitionerId=&date=YYYY-MM-DD`
- `GET /api/appointments` → upcoming for current user
- `POST /api/appointments { practitionerId, startsAtISO }`
- `PATCH /api/appointments/:id { action: "cancel" }`

## Notifications
- `GET/POST /api/notifications/preferences`
- `POST /api/jobs/reminders?windowMin=15` → requires `X-Cron-Secret` or platform_admin

## Google Calendar
- `GET /api/google/oauth/start` → redirect to Google OAuth
- `GET /api/google/oauth/callback` → store tokens
- `GET /api/google/status` → `{ connected }`

## Uploads (dev)
- `POST /api/uploads` → multipart form-data `{ file }` stores under `public/uploads` and returns `{ url }`


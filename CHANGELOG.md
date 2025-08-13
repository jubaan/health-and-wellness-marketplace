# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog, and this project adheres to semantic versioning where feasible.

## [Unreleased]
- Reviews/ratings flow and ranking integration
- Stripe payments (hold/capture, refunds)
- PostGIS/pg_trgm search improvements
- Audit logs for sensitive actions
- S3/Supabase uploads with signed URLs

## [0.1.0] - 2025-08-13
### Added
- App scaffold with Next.js (App Router) + TypeScript + Tailwind
- Authentication via Clerk, with organizations for companies
- Role-based access control (RBAC) and Role Switcher in the header
- Platform role sync and organization membership sync from Clerk
- Fine-grained permissions with practitioner delegates (profile, availability, appointments)
- Company assistants manager (invite, role update, remove; pending invites list)
- Search with tiered matching (location, specialties/tags, rating)
- Practitioner/company public pages
- Availability rules and booking with slot/buffer policy
- Appointments API with cancel action and upcoming views (patient/practitioner)
- Google Calendar OAuth, FreeBusy checks, and event creation
- Notifications via SendGrid (email) and Twilio (WhatsApp), with user preferences
- Reminders endpoint (24h & 1h) with idempotency
- Global banner with Top Context (role + company) and auto-breadcrumbs
- Local uploads API (dev) for avatars + avatar display in UI
- Prisma schema and minimal seed script using public placeholder avatars
- Documentation: Architecture, Roles & Permissions, Booking & Scheduling, Notifications, Search & Matching, API Reference, Security & Compliance, Coding Standards, Contributing, Roadmap

### Changed
- Centralized error responses to a consistent JSON shape across APIs
- Hardened sensitive endpoints with explicit authz checks

### Notes
- Time stored in UTC; client displays in browser locale
- Some provider features (e.g., Clerk invite resend/revoke) may vary by SDK support; endpoints return 501 if unavailable

[Unreleased]: https://github.com/jubaan/health-and-wellness-marketplace/compare/development...HEAD
[0.1.0]: https://github.com/jubaan/health-and-wellness-marketplace/tree/development

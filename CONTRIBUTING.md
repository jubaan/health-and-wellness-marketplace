# Contributing Guide

## Getting Started
- Clone the repo and switch to the `development` branch.
- Install deps: `npm install`
- Env: `cp .env.example .env.local` and fill required keys (Clerk, DB, etc.).
- DB: `npm run db:generate && npm run db:push` (optional: `npm run db:seed`).
- Dev server: `npm run dev` (http://localhost:3000)

## Branches & Workflow
- Default branch: `development`
- Feature branches: `feat/<short-name>` (e.g., `feat/reviews`)
- Fix branches: `fix/<short-name>` (e.g., `fix/booking-overlap`)
- Docs/Chore: `docs/...`, `chore/...`
- Open PRs into `development`; keep changes focused and small.

## Commit Messages
- Use Conventional Commits:
  - `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, `refactor: ...`, `test: ...`
- Present tense, concise, and scoped.

## Code Style
- Language: TypeScript (strict). See `docs/CODING_STANDARDS.md`.
- Lint: `npm run lint` (Next.js ESLint config)
- Formatting: follow ESLint rules; keep lines ~100 chars.

## Tests
- Unit: Vitest (`npm test`).
- Prefer tests for authz, API logic, and utilities.
- Avoid network calls in tests; mock Clerk/Prisma/Integrations.

## PR Checklist
- Description of change and rationale
- Screenshots (UI changes)
- Steps to test locally
- Env changes documented (if any)
- Added/updated tests when reasonable

## Security & Data
- Never commit secrets or PII.
- Follow `docs/SECURITY_COMPLIANCE.md` guidelines.


# Coding Standards

## Languages & Frameworks
- TypeScript (strict) across app and APIs
- Next.js App Router; prefer server components where feasible

## Style
- Indentation: 2 spaces; keep lines ~100 chars
- Naming:
  - Files: kebab-case (`search-page.tsx`), React components PascalCase (`Header.tsx`)
  - Variables: camelCase; constants UPPER_SNAKE only when global
  - Prisma models: PascalCase; table columns snake_case (Prisma handles)
- Imports: absolute paths via `@/` alias

## React
- Prefer server components for pages; use client components only for stateful/UI elements
- Co-locate small components in `src/components`
- Forms: React Hook Form + Zod (when adding validation)

## API
- Error shape: `{ error: { code, message } }` with appropriate status codes (use `src/lib/errors.ts`)
- Authz helpers: use `src/lib/authz.ts` for RBAC/delegate checks
- Keep handlers small; extract logic to `src/lib` when non-trivial

## Data & DB
- Prisma client via `src/lib/prisma.ts`
- Use upserts carefully; prefer explicit create/update paths for clarity
- Store timestamps in UTC

## Testing
- Vitest for unit tests under `src/**/__tests__/**`
- Mock external services (Clerk, Prisma, SendGrid, Twilio)
- Cover edge cases (403/401/404 paths) and happy paths

## Commits & PRs
- Conventional Commits
- One logical change per PR; small, focused diffs are easier to review


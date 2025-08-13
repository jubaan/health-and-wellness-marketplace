# Security & Compliance (MX/Cofepris)

## Data Minimization
- Treat diagnoses/interests as tags for matching; do not store medical records in MVP.
- Avoid logging PII/PHI; mask emails/IDs in logs.

## Access Control
- Strict RBAC and delegate checks in all sensitive endpoints.
- Audit key actions (book, cancel, approve) — planned for next iteration.

## Communications
- Explicit consent for notifications; clear opt-outs via preferences.
- Use provider templates compliant with MX regulations.

## Storage & Secrets
- Store secrets in environment variables; never commit.
- Consider KMS/secret managers and token encryption for production.

## Network & Privacy
- Use HTTPS; verify webhook signatures.
- Rate limit sensitive endpoints (booking, auth) in production.

## Timezones & Records
- Store timestamps in UTC; include timezone context in user-facing messages.


# Roadmap (High-Level)

## Near Term
- Reviews & Ratings
  - Model + write flow + moderation
  - Use in Tier 3 ranking
- Payments (Stripe)
  - Hold/capture; refunds on cancel window policy
  - Practitioner/company payout strategy
- Timezone UX
  - User-preferred timezone; consistent formatting in UI/notifications
- Image Storage
  - Move uploads to S3/Supabase with signed URLs + validation
- PostGIS & Search
  - ST_DWithin for radius; pg_trgm for fuzzy text
- Audit Logs
  - Record sensitive actions (book, cancel, approvals, notifications)

## Mid Term
- Messaging
  - In-app threads with patients; consent and retention policies
- Policy Engine
  - Cancellation/no-show fees; company-specific rules
- Multi-tenancy polish
  - Company-scoped analytics; platform manager tooling
- Internationalization
  - ES/MX default; add EN translations

## Long Term
- Mobile optimizations
- Performance and cost tuning
- Advanced analytics and dashboards
- Marketplace growth tooling (campaigns, referrals)


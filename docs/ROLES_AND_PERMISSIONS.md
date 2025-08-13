# Roles & Permissions

## Platform Roles
- platform_admin: Full platform control
- platform_accounts_manager: Manage assigned accounts/companies/practitioners

## Company Roles (Clerk Organizations)
- company_admin: Clerk org admin; can manage assistants, enrollments, and company profile
- company_support_team: Member-level access; limited operations

## Practitioner & Delegates
- practitioner: Manages own profile, availability, appointments, enrollments
- practitioner_assistant: Via PractitionerDelegate with flags:
  - canManageProfile
  - canManageAvailability
  - canManageAppointments

## Patient
- Search, book, manage own appointments and notifications

## Enforcement
- Role derivation: `src/lib/rbac.ts` (claims → metadata → orgs → fallback)
- Endpoint checks: `src/lib/authz.ts`
  - `requireAnyRole()` for coarse RBAC
  - `isCompanyAdminFor(companyId)` for company-sensitive actions
  - `canManageProfile/Availability/Appointments(practitionerId)` for delegate flags
- Active role cookie + Clerk session publicMetadata ensures consistent SSR/CSR behavior

## Business Constraints
- Only company_admin can approve/reject enrollments and manage assistants
- Company updates require company_admin; creating new companies requires platform roles
- Practitioner assistants must be explicitly granted permissions per practitioner


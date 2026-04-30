# Admin Role Permission Matrix

This document is the approval draft for Sewa Setu's admin access model.

It is intentionally stricter than the current implementation. The goal is to lock the safest practical role structure before changing the Prisma schema or permission guards.

## Final Role Model

### Platform roles

- `USER`: public end user / patient account.
- `PLATFORM_SUPPORT`: support staff from Sewa Setu. Scoped to assigned hospitals only. No routine patient-record access.
- `PLATFORM_ADMIN`: full platform administration. Can manage hospitals, approvals, suspensions, assignments, and platform users. No routine patient-record access.

### Hospital roles

- `OWNER`: highest authority for one hospital's business presence on the platform.
- `MANAGER`: day-to-day operational admin for one hospital.
- `RECEPTIONIST`: front-desk and booking operations.
- `DOCTOR`: practitioner access limited to their own schedule and their own assigned patients.
- `STAFF`: narrow non-doctor support role. Keep this role limited in v1.

## Access Principles

1. Platform roles and hospital roles are separate concerns.
2. Hospital access is granted only through an `APPROVED` membership.
3. No user may see cross-hospital data unless they are a platform user acting within an explicitly allowed scope.
4. Platform staff do not get default patient-record access just because they work for the platform.
5. Clinical access is scoped by care relationship, not by business seniority.
6. Sensitive actions must be written to `AuditLog`.
7. If a role needs broad exceptions, that is usually a signal that the role model is wrong.

## Scope Legend

- `Yes`: routine permission within the role's normal scope.
- `Limited`: partial access only, usually a field subset or reduced action set.
- `Own`: only the user's own records, appointments, or assigned patients.
- `Assigned`: only explicitly assigned hospitals, tasks, or support cases.
- `Controlled`: allowed only through an extra review path with explicit reason and audit trail.
- `No`: not allowed.

## Platform Permission Matrix

| Action | Platform Admin | Platform Support | Notes |
| --- | --- | --- | --- |
| Review hospital inquiries | Yes | Assigned | Support can triage or communicate, but final decision stays with platform admin. |
| Approve / reject hospital onboarding | Yes | No | This is a platform authority action. |
| Create hospital record | Yes | No | Includes initial tenant creation. |
| Activate / suspend hospital | Yes | No | Suspension is business-critical and must be audited. |
| Create initial hospital owner | Yes | No | First owner account is created or approved by platform admin. |
| Assign support staff to hospitals | Yes | No | Required to keep support scope bounded. |
| View hospital operational status | Yes | Assigned | Non-clinical operational visibility only. |
| Manage platform users and roles | Yes | No | Includes promotion to `PLATFORM_SUPPORT` or `PLATFORM_ADMIN`. |
| View platform-wide audit logs | Yes | Limited | Support may view only assigned-hospital operational logs if needed. |
| View hospital billing / contract status | Yes | Assigned | Support may have read-only access for assigned accounts if needed. |
| View patient identity / contact data | Controlled | No | Break-glass only, never routine support access. |
| View clinical notes / medical data | Controlled | No | Exceptional path only, with explicit audit and reason capture. |
| Export patient data | Controlled | No | Never a routine platform permission. |

## Hospital Permission Matrix

| Action | Owner | Manager | Receptionist | Doctor | Staff |
| --- | --- | --- | --- | --- | --- |
| Manage hospital legal profile, subscription, and ownership settings | Yes | No | No | No | No |
| Manage hospital public profile and media | Yes | Yes | No | No | No |
| Manage departments, doctor listings, packages, and service catalog | Yes | Yes | No | No | No |
| Invite staff | Yes | Limited | No | No | No |
| Remove staff | Yes | Limited | No | No | No |
| Approve internal access requests | Yes | Limited | No | No | No |
| Assign staff roles | Yes | Limited | No | No | No |
| Manage doctor availability and schedules | Yes | Yes | No | Own | No |
| View hospital-wide bookings | Yes | Yes | Yes | Own | Assigned |
| Create bookings | Yes | Yes | Yes | No | No |
| Reschedule bookings | Yes | Yes | Yes | Own | No |
| Cancel bookings | Yes | Yes | Yes | Own | No |
| Confirm bookings | Yes | Yes | Yes | No | No |
| Check in patients | Yes | Yes | Yes | No | Assigned |
| Mark appointment completed | Yes | Yes | Limited | Own | No |
| Moderate hospital reviews | Yes | Yes | No | No | No |
| View operational reports | Yes | Yes | Limited | Own | No |
| Export operational reports | Yes | Limited | No | Own | No |

## Patient Data Matrix

| Data / Action | Platform Admin | Platform Support | Owner | Manager | Receptionist | Doctor | Staff |
| --- | --- | --- | --- | --- | --- | --- | --- |
| View patient identity and contact info | Controlled | No | Limited | Limited | Limited | Own | Assigned |
| Edit patient contact / admin details | No | No | Limited | Limited | Limited | No | No |
| View appointment history for this hospital | Controlled | No | Yes | Yes | Limited | Own | Assigned |
| View clinical notes / medical details | Controlled | No | Controlled | No | No | Own | No |
| Write clinical notes / medical updates | No | No | No | No | No | Own | No |
| Export patient data | Controlled | No | Controlled | No | No | No | No |

## Hard Rules Behind The Matrix

### 1. Platform admin is powerful, but not casually clinical

`PLATFORM_ADMIN` is for platform governance, not routine chart access.

If a patient-data incident ever requires platform intervention, use a controlled break-glass path:

- explicit reason captured
- time-limited access
- full audit trail
- ideally second-person approval for highly sensitive access

Do not model this as normal `PLATFORM_ADMIN` read access.

### 2. Owner is a business owner, not automatically a clinician

`OWNER` can fully run the hospital's presence on the platform:

- staff
- profile
- billing
- settings
- reports

But `OWNER` should not be your shortcut to unrestricted clinical access. Clinical access should remain tied to care involvement.

### 3. Manager can run operations without becoming an owner

`MANAGER` should be strong enough to run the hospital day to day, but should not:

- control subscription or ownership settings
- gain unrestricted patient-data export
- gain unrestricted clinical record access

### 4. Receptionist is operational only

`RECEPTIONIST` should handle:

- booking
- rescheduling
- cancellation
- check-in
- contact updates

Reception should not browse clinical notes or manage hospital structure.

### 5. Doctor access must be "own only"

`DOCTOR` must be scoped to:

- own schedule
- own bookings
- own assigned patients
- own clinical documentation

Do not collapse doctor access into a generic staff role.

### 6. Keep `STAFF` narrow in v1

For v1, `STAFF` should remain a minimal support role. If later you need care-team roles with wider clinical access, split them into explicit subroles such as:

- `NURSE`
- `LAB_TECH`
- `PHARMACY`

Do not stretch one broad `STAFF` role until it becomes impossible to reason about.

## Important Edge Case: Owner Who Is Also A Doctor

This is common in smaller hospitals and clinics.

Policy recommendation:

- do not solve this by giving `OWNER` broad clinical write access
- clinical actions should still require doctor-scoped checks
- if the same person is both owner and doctor, link them to a doctor profile and evaluate clinical permissions through that doctor relationship

This matters because your current single-membership-role model cannot represent dual hospital roles cleanly. That is acceptable for now as long as you do not use ownership as a shortcut for clinical permissions.

## Hospital Onboarding Decision

This is the recommended onboarding sequence:

1. Hospital submits `PartnerInquiry`.
2. Platform reviews legitimacy and documents.
3. Platform admin creates the `Hospital`.
4. Platform admin creates or links the initial user.
5. That user receives `OWNER` membership with `APPROVED` status.
6. Owner invites `MANAGER`, `RECEPTIONIST`, `DOCTOR`, and `STAFF`.
7. Only approved memberships can enter the hospital workspace.

## Implications For The Current Codebase

These are the main differences between this target model and the current project:

- `UserRole.ADMIN` should become `PLATFORM_SUPPORT` or be retired.
- `HospitalRole.CONTENT_EDITOR` should not remain a core hospital role in the final model.
- `src/lib/admin-auth.ts` currently treats platform admins as owner-level hospital users. That is convenient, but it is not the target security model.
- `src/lib/admin-permissions.ts` currently models only owner, manager, reception, and content editor permissions. It will need to expand to the final role set.
- If doctors will log in, `Doctor` should be linked to `User` before doctor-scoped permissions are enforced.

## Approval Target

Approve this document if you want the project to move toward this final access model:

- Platform: `USER`, `PLATFORM_SUPPORT`, `PLATFORM_ADMIN`
- Hospital: `OWNER`, `MANAGER`, `RECEPTIONIST`, `DOCTOR`, `STAFF`
- No routine patient-data access for platform staff
- No mega-role that merges owner, manager, and doctor behavior
- Clinical permissions tied to assignment, not seniority

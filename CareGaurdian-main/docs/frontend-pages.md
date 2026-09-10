# CareGaurdian — Frontend Page Manifest (Phase 2)

> **Status:** Scaffolding complete. Every page below has a routed `PagePlaceholder` screen in `apps/expo/app/`. Builders replace the placeholder body with real content. **Do NOT add npm packages.** Locked constraints: `headerShown:false` in all new group layouts; theme teal-600 `#0d9488` + slate + `bg-slate-50`; import aliases `@components`, `@hooks`, `@lib`, `@baseline/types`.

## Builder assignments

| Builder | Groups | Route roots |
|---|---|---|
| FrontendA | PUBLIC, AUTH, ONBOARDING, SYSTEM | `app/public/`, `app/auth/`, `app/onboarding/`, `app/system/` |
| FrontendB | PATIENT, ACCOUNT | `app/patient/my-health/`, `app/account/` |
| FrontendC | CLINICIAN (additions), PHARMACIST, EMERGENCY | `app/clinician/`, `app/pharmacist/`, `app/emergency/` |
| FrontendD | CAREGIVER, GUARDIAN, ADMIN | `app/caregiver/`, `app/guardian/`, `app/admin/` |

## API conventions (locked)

- Base URL: `EXPO_PUBLIC_API_URL` (`.env` → `http://localhost:3010`), fallback `http://localhost:3000/api/v1` in `lib/api.ts`.
- All data access via existing hooks in `apps/expo/hooks/` (18 hooks, all under `@hooks`).
- Existing patient-scoped endpoints follow the pattern `GET /patients/:patientId/<resource>`.
- **API GAP** = no backend endpoint exists today. Screen is scaffolded; builders must call `api.get` only when a real hook is listed. Do NOT invent endpoints.
- Auth/session: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`.

---

## PUBLIC (FrontendA) — `app/public/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | About | `public/about.tsx` | — (static) | |
| 2 | How It Works | `public/how-it-works.tsx` | — (static) | |
| 3 | Features | `public/features.tsx` | — (static) | |
| 4 | Security | `public/security.tsx` | — (static) | |
| 5 | For Patients | `public/for-patients.tsx` | — (static) | |
| 6 | For Caregivers | `public/for-caregivers.tsx` | — (static) | |
| 7 | For Clinicians | `public/for-clinicians.tsx` | — (static) | |
| 8 | Contact | `public/contact.tsx` | GAP: no contact form endpoint | **API GAP** if form submission needed |
| 9 | Help Center | `public/help-center.tsx` | — (static) | |
| 10 | FAQ | `public/faq.tsx` | — (static) | |
| 11 | Privacy Policy | `public/privacy-policy.tsx` | — (static) | |
| 12 | Terms of Service | `public/terms-of-service.tsx` | — (static) | |
| 13 | Medical Disclaimer | `public/medical-disclaimer.tsx` | — (static) | |
| 14 | Cookie Policy | `public/cookie-policy.tsx` | — (static) | |
| 15 | Accessibility | `public/accessibility.tsx` | — (static) | |
| 16 | Data Processing | `public/data-processing.tsx` | — (static) | |
| 17 | Responsible Disclosure | `public/responsible-disclosure.tsx` | — (static) | |
| 18 | AI Transparency | `public/ai-transparency.tsx` | — (static) | |

## AUTH (FrontendA) — `app/auth/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | Verify Email | `auth/verify-email.tsx` | GAP: no `POST /auth/verify-email` | **API GAP** — likely needs backend addition |
| 2 | Verify Phone | `auth/verify-phone.tsx` | GAP | **API GAP** |
| 3 | Forgot Password | `auth/forgot-password.tsx` | GAP: no `/auth/forgot-password` | **API GAP** |
| 4 | Reset Password | `auth/reset-password.tsx` | GAP: no `/auth/reset-password` | **API GAP** |
| 5 | MFA | `auth/mfa.tsx` | GAP: no MFA endpoints | **API GAP** |
| 6 | Passkey Setup | `auth/passkey-setup.tsx` | GAP: no passkey/WebAuthn endpoints | **API GAP** |
| 7 | Account Recovery | `auth/account-recovery.tsx` | GAP | **API GAP** |
| 8 | Accept Invitation | `auth/accept-invitation.tsx` | GAP: no invitation endpoints | **API GAP** |
| 9 | Session Expired | `auth/session-expired.tsx` | local (401 from `apiFetch`) | Reuses existing 401 handling in `lib/api.ts` |

## ONBOARDING (FrontendA) — `app/onboarding/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | Welcome | `onboarding/welcome.tsx` | — | Entry from login/register |
| 2 | Choose Role | `onboarding/choose-role.tsx` | `POST /auth/register` (role on register) | Role list can mirror `GET /roles` if needed |
| 3 | Personal Information | `onboarding/personal-info.tsx` | `POST /auth/register`, `GET /auth/me` | |
| 4 | Patient Setup | `onboarding/patient-setup.tsx` | `POST /patients` (verify exact shape), `PATCH /patients/:id` | |
| 5 | Caregiver Setup | `onboarding/caregiver-setup.tsx` | GAP: no caregiver profile endpoint | **API GAP** — assign caregiver→patient link |
| 6 | Guardian Setup | `onboarding/guardian-setup.tsx` | `POST /guardians` | |
| 7 | Clinician Setup | `onboarding/clinician-setup.tsx` | `PATCH /users/:id` (role/org fields) | |
| 8 | Organization Setup | `onboarding/organization-setup.tsx` | GAP: no organizations module | **API GAP** |
| 9 | Emergency Contact | `onboarding/emergency-contact.tsx` | GAP: no dedicated contact endpoint (guardians exist) | **API GAP** or reuse guardians |
| 10 | Consent | `onboarding/consent.tsx` | `POST /consents` | PENDING → approve flow |
| 11 | Permissions | `onboarding/permissions.tsx` | `POST /consents` (derived permissions) | |
| 12 | Notification Preferences | `onboarding/notification-preferences.tsx` | GAP: no prefs endpoint | **API GAP** |
| 13 | Complete | `onboarding/complete.tsx` | — | Route by role → tabs/clinician |

## PATIENT (FrontendB) — `app/patient/my-health/`

> All self-service pages. Reuse hooks directly — `usePatientSummary`, `useTimeline`, `useMedications`, etc. Contact `usePatient`/`usePatients` only where a concrete patientId is available (from `PATCH /patients` flow).

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | Health Dashboard | `patient/my-health/dashboard.tsx` | `usePatientSummary` → `GET /patients/:id/summary` | |
| 2 | Health Memory | `patient/my-health/memory.tsx` | `useMemory` → `GET /patients/:id/memory` | |
| 3 | Timeline | `patient/my-health/timeline.tsx` | `useTimeline` → `GET /patients/:id/timeline` | |
| 4 | Health Events | `patient/my-health/events.tsx` | `GET /patients/:patientId/events` (health-events module) | |
| 5 | Event Details | `patient/my-health/event-details.tsx` | param `:id`; nearest: `GET /patients/:patientId/events` | Detail-by-id GAP if filtering not server-side |
| 6 | Medications | `patient/my-health/medications.tsx` | `useMedications` → `GET /patients/:id/medications` | |
| 7 | Medication Details | `patient/my-health/medication-details.tsx` | param `:id`; within medications payload | |
| 8 | Allergies | `patient/my-health/allergies.tsx` | `GET /patients/:patientId/allergies` | |
| 9 | Conditions | `patient/my-health/conditions.tsx` | `GET /patients/:patientId/conditions` | |
| 10 | Lab Results | `patient/my-health/lab-results.tsx` | `GET /patients/:patientId/lab-results` | |
| 11 | Procedures | `patient/my-health/procedures.tsx` | GAP: no procedures endpoint | **API GAP** |
| 12 | Hospital Visits | `patient/my-health/hospital-visits.tsx` | `GET /patients/:patientId/encounters` | Encounters = hospital visits |
| 13 | Health Check-in | `patient/my-health/check-in.tsx` | `POST /patients/:id/observations` via `useObservations` | |
| 14 | Symptoms | `patient/my-health/symptoms.tsx` | GAP: no symptoms endpoint | **API GAP** — observations may cover |
| 15 | Appointments | `patient/my-health/appointments.tsx` | GAP: no appointments module | **API GAP** |
| 16 | Care Team | `patient/my-health/care-team.tsx` | GAP: no care-team module | **API GAP** |
| 17 | Caregivers | `patient/my-health/caregivers.tsx` | `GET /guardians/patients/:patientId` (guardians module) | |
| 18 | Guardian / Proxy | `patient/my-health/guardian-proxy.tsx` | `GET /guardians/patients/:patientId` | |
| 19 | Emergency Card | `patient/my-health/emergency-card.tsx` | `useEmergencySummary` → `GET /patients/:id/emergency-summary` | |
| 20 | Notifications | `patient/my-health/notifications.tsx` | `useNotifications` → `GET /notifications` | |
| 21 | Documents | `patient/my-health/documents.tsx` | `useDocuments` → `GET /patients/:id/documents` | |
| 22 | Consent & Access | `patient/my-health/consent-access.tsx` | `GET /patients/:patientId/consents`, `POST /consents/:id/revoke` | |
| 23 | Privacy | `patient/my-health/privacy.tsx` | — (static) | |
| 24 | Settings | `patient/my-health/settings.tsx` | `GET /users/me`, `PATCH /users/:id` | |

## CAREGIVER (FrontendD) — `app/caregiver/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | Dashboard | `caregiver/index.tsx` | `usePatients` + `useNotifications` | |
| 2 | My Patients | `caregiver/patients.tsx` | `usePatients` → `GET /patients` | Filter by caregiver relation |
| 3 | Patient Overview | `caregiver/patient-overview.tsx` | `usePatientSummary` (param `:patientId`) | |
| 4 | Today's Care | `caregiver/today-care.tsx` | GAP: no care-plan/tasks module | **API GAP** |
| 5 | Report Change | `caregiver/report-change.tsx` | `POST /patients/:id/observations` | |
| 6 | Voice Observation | `caregiver/voice-observation.tsx` | `POST /patients/:id/observations` | **API GAP** for transcription if backend-hosted |
| 7 | Observation History | `caregiver/observation-history.tsx` | `useObservations` → `GET /patients/:id/observations` | |
| 8 | Observation Details | `caregiver/observation-details.tsx` | param `:id`; within observations payload | |
| 9 | Medication Tasks | `caregiver/medication-tasks.tsx` | GAP: no tasks endpoint | **API GAP** |
| 10 | Care Tasks | `caregiver/care-tasks.tsx` | GAP: no tasks endpoint | **API GAP** |
| 11 | Care Plan | `caregiver/care-plan.tsx` | GAP: no care-plan endpoint | **API GAP** |
| 12 | Patient Timeline | `caregiver/patient-timeline.tsx` | `useTimeline` | |
| 13 | Recent Changes | `caregiver/recent-changes.tsx` | `useChanges` → `GET /patients/:id/changes` | |
| 14 | Notifications | `caregiver/notifications.tsx` | `useNotifications` | |
| 15 | Care Team | `caregiver/care-team.tsx` | GAP: no care-team module | **API GAP** |
| 16 | Access & Permissions | `caregiver/access-permissions.tsx` | `GET /patients/:patientId/consents`, `POST /consents` | |
| 17 | Settings | `caregiver/settings.tsx` | `GET /users/me`, `PATCH /users/:id` | |

## GUARDIAN (FrontendD) — `app/guardian/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | Dashboard | `guardian/index.tsx` | `usePatients` + `useNotifications` | |
| 2 | Patients | `guardian/patients.tsx` | `GET /guardians/patients/:patientId` → reverse | |
| 3 | Patient Overview | `guardian/patient-overview.tsx` | `usePatientSummary` | |
| 4 | Health Memory | `guardian/health-memory.tsx` | `useMemory` | |
| 5 | Timeline | `guardian/timeline.tsx` | `useTimeline` | |
| 6 | Medications | `guardian/medications.tsx` | `useMedications` | |
| 7 | Health Changes | `guardian/health-changes.tsx` | `useChanges` | |
| 8 | Caregiver Activity | `guardian/caregiver-activity.tsx` | GAP: no activity feed endpoint | **API GAP** — audit module may cover |
| 9 | Consent Management | `guardian/consent-management.tsx` | `GET /patients/:patientId/consents`, `POST /consents/:id/approve`, `POST /consents/:id/revoke` | |
| 10 | Access Management | `guardian/access-management.tsx` | `POST /consents`, `POST /consents/:id/revoke` | |
| 11 | Emergency Information | `guardian/emergency-information.tsx` | `useEmergencySummary` | |
| 12 | Documents | `guardian/documents.tsx` | `useDocuments` | |
| 13 | Notifications | `guardian/notifications.tsx` | `useNotifications` | |
| 14 | Settings | `guardian/settings.tsx` | `GET /users/me`, `PATCH /users/:id` | |

## CLINICIAN — existing (13, preserved) + additions (FrontendC)

### Existing — preserve as-is

| Page | Route file | Data hook |
|---|---|---|
| Dashboard (My Patients) | `clinician/index.tsx` | `usePatients` |
| Patient Overview | `patient/[id].tsx` | `usePatient`, `usePatientSummary` |
| What Changed | `clinician/what-changed.tsx` | `useWhatChanged` |
| Personal Baseline | `clinician/cognitive.tsx` | `useBaseline` |
| Health Change Graph | `clinician/graph.tsx` | `useHealthGraph` |
| Episodes | `clinician/episodes.tsx` | `useEpisodes` |
| Medication Intelligence | `clinician/medications.tsx` | `useMedications` |
| Interactions | `clinician/contradictions.tsx` | `useContradictions` |
| Missing Information | `clinician/gaps.tsx` | `useMissingInfo` |
| Clinical Brief | `clinician/brief.tsx` | `useBrief` |
| Documents | `clinician/documents.tsx` | `useDocuments` |
| Audit History | `clinician/audit.tsx` | `GET /audit` |
| Functional Trajectory | `clinician/functional.tsx` | `useBaseline` (subset) |
| Emergency | `clinician/emergency.tsx` | `useEmergencySummary` |

### Additions — scaffolded, build inside existing `app/clinician/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | My Patients (landing duplicate, optional) | `clinician/patients.tsx` | `usePatients` | Can be removed if `index` covers it |
| 2 | Episode Details | `clinician/episode-details.tsx` | param `:id`; within episodes payload | |
| 3 | Episode Comparison | `clinician/episode-comparison.tsx` | GAP: no comparison endpoint | **API GAP** — client-side compare of episodes possible |
| 4 | Deterioration Signature | `clinician/deterioration-signature.tsx` | `useBaseline` + `useChanges` | Composite; heuristic UI |
| 5 | Caregiver Signals | `clinician/caregiver-signals.tsx` | `useChanges` + `useObservations` | Composite |
| 6 | Evidence Explorer | `clinician/evidence-explorer.tsx` | GAP: no evidence endpoint | **API GAP** — client-side over observations/timeline |
| 7 | AI Assistant | `clinician/ai-assistant.tsx` | `POST /ai/query` (verify module) | Verify ai module response before wiring |
| 8 | Clinician Feedback | `clinician/clinician-feedback.tsx` | GAP: no feedback endpoint | **API GAP** |
| 9 | Care Team | `clinician/care-team.tsx` | GAP: no care-team module | **API GAP** |
| 10 | Consent | `clinician/consent.tsx` | `GET /patients/:patientId/consents`, `POST /consents/:id/approve` | |

## PHARMACIST (FrontendC) — `app/pharmacist/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | Dashboard | `pharmacist/index.tsx` | `usePatients` | Risk queue from medications payload client-side |
| 2 | Patient Medication Overview | `pharmacist/patient-medication-overview.tsx` | `useMedications` | |
| 3 | Medication Risk Review | `pharmacist/medication-risk-review.tsx` | `useContradictions` | Interactions/contradictions review |
| 4 | Adherence | `pharmacist/adherence.tsx` | GAP: no adherence endpoint | **API GAP** |
| 5 | Interactions | `pharmacist/interactions.tsx` | `useContradictions` | |
| 6 | Evidence | `pharmacist/evidence.tsx` | GAP: no evidence endpoint | **API GAP** |
| 7 | Pharmacist Feedback | `pharmacist/pharmacist-feedback.tsx` | GAP: no feedback endpoint | **API GAP** |
| 8 | Consent | `pharmacist/consent.tsx` | `GET /patients/:patientId/consents` | |
| 9 | Notifications | `pharmacist/notifications.tsx` | `useNotifications` | |
| 10 | Settings | `pharmacist/settings.tsx` | `GET /users/me`, `PATCH /users/:id` | |

## EMERGENCY (FrontendC) — `app/emergency/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | Landing | `emergency/index.tsx` | — | |
| 2 | Patient Lookup | `emergency/patient-lookup.tsx` | `GET /patients` (+ query params) | |
| 3 | QR Scan | `emergency/qr-scan.tsx` | GAP: no QR decode endpoint; parsed client-side → lookup | **API GAP** (client lib only) |
| 4 | Access Confirmation | `emergency/access-confirmation.tsx` | `POST /patients/:id/emergency-access` (emergency module) | |
| 5 | Emergency Summary | `emergency/summary.tsx` | `useEmergencySummary` | |
| 6 | Critical Allergies | `emergency/critical-allergies.tsx` | summary payload → allergies | |
| 7 | Current Medications | `emergency/current-medications.tsx` | summary payload → medications | |
| 8 | Major Conditions | `emergency/major-conditions.tsx` | summary payload → conditions | |
| 9 | Recent Hospitalizations | `emergency/recent-hospitalizations.tsx` | `GET /patients/:patientId/encounters` | |
| 10 | Important Procedures | `emergency/important-procedures.tsx` | GAP: no procedures endpoint | **API GAP** |
| 11 | Emergency Contacts | `emergency/emergency-contacts.tsx` | `GET /guardians/patients/:patientId` | |
| 12 | Emergency Information | `emergency/emergency-information.tsx` | — (static guidance) | |

## ADMIN (FrontendD) — `app/admin/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | Dashboard | `admin/index.tsx` | `GET /audit` + static metrics | |
| 2 | Patients | `admin/patients.tsx` | `usePatients` | |
| 3 | Care Team | `admin/care-team.tsx` | `GET /users` (verify), `GET /roles` | |
| 4 | Caregivers | `admin/caregivers.tsx` | `GET /users` filtered by role | |
| 5 | Guardians | `admin/guardians.tsx` | `GET /guardians/patients/:patientId` per patient | |
| 6 | Organizations | `admin/organizations.tsx` | GAP: no organizations module | **API GAP** |
| 7 | Roles & Permissions | `admin/roles-permissions.tsx` | `GET /roles` | |
| 8 | Consent Tracking | `admin/consent-tracking.tsx` | `GET /patients/:patientId/consents` (aggregate) | |
| 9 | Audit Log | `admin/audit-log.tsx` | `GET /audit` | |
| 10 | Notifications | `admin/notifications.tsx` | GAP: no broadcast/send endpoint | **API GAP** — list only via `useNotifications` |
| 11 | Caregiver Activity | `admin/caregiver-activity.tsx` | `GET /audit` filtered by actor | |
| 12 | Clinician Performance | `admin/clinician-performance.tsx` | `GET /audit` filters + roles | |
| 13 | Pharmacist Activity | `admin/pharmacist-activity.tsx` | `GET /audit` filters | |
| 14 | AI Evaluations | `admin/ai-evaluations.tsx` | GAP: no evaluations endpoint | **API GAP** |
| 15 | AI Safety Events | `admin/ai-safety-events.tsx` | GAP: no safety-event endpoint | **API GAP** — audit may cover |
| 16 | Integrations | `admin/integrations.tsx` | GAP | **API GAP** |
| 17 | FHIR Export | `admin/fhir-export.tsx` | GAP: no export endpoint | **API GAP** |
| 18 | Data Imports | `admin/data-imports.tsx` | GAP | **API GAP** |
| 19 | Feature Flags | `admin/feature-flags.tsx` | GAP | **API GAP** |
| 20 | System Health | `admin/system-health.tsx` | GAP: no health endpoint | **API GAP** — infra/docker-compose only |
| 21 | Settings | `admin/settings.tsx` | `GET /users/me`, `PATCH /users/:id` | |

## ACCOUNT (FrontendB) — `app/account/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | Profile | `account/index.tsx` | `GET /users/me` | |
| 2 | Personal Information | `account/personal-info.tsx` | `PATCH /users/:id` | |
| 3 | Contact Information | `account/contact-info.tsx` | `PATCH /users/:id` | |
| 4 | Organizations | `account/organizations.tsx` | GAP: no organizations module | **API GAP** |
| 5 | Account Security | `account/account-security.tsx` | `POST /auth/logout`; GAP: password change/2FA | **API GAP** for change password |
| 6 | Sessions & Devices | `account/sessions-devices.tsx` | GAP: no session-list/revoke endpoint | **API GAP** |
| 7 | Connected Apps | `account/connected-apps.tsx` | GAP | **API GAP** |
| 8 | Data & Export | `account/data-export.tsx` | GAP | **API GAP** — FHIR export pending (admin) |
| 9 | Notification Preferences | `account/notification-preferences.tsx` | GAP: no prefs endpoint | **API GAP** |
| 10 | Privacy & Data | `account/privacy.tsx` | — (static) | Links to public/system policies |
| 11 | Danger Zone | `account/danger-zone.tsx` | GAP: no account deletion endpoint | **API GAP** — guard with confirm flow |

## SYSTEM (FrontendA) — `app/system/`

| # | Page | Route file | Data hook / endpoint | Notes |
|---|---|---|---|---|
| 1 | About | `system/about.tsx` | — (static) | |
| 2 | System Status | `system/system-status.tsx` | GAP: no health endpoint | **API GAP** |
| 3 | Privacy Policy | `system/privacy-policy.tsx` | — (static) | |
| 4 | Terms of Service | `system/terms-of-service.tsx` | — (static) | |
| 5 | Medical Disclaimer | `system/medical-disclaimer.tsx` | — (static) | |
| 6 | Accessibility | `system/accessibility.tsx` | — (static) | |
| 7 | Open Source Licenses | `system/licenses.tsx` | — (static) | |
| 8 | Data Processing Agreement | `system/data-processing.tsx` | — (static) | |
| 9 | Responsible Disclosure | `system/responsible-disclosure.tsx` | — (static) | |
| 10 | Cookie Policy | `system/cookie-policy.tsx` | — (static) | |
| 11 | AI Transparency | `system/ai-transparency.tsx` | — (static) | |
| 12 | Contact & Support | `system/contact-support.tsx` | GAP: no support ticket endpoint | **API GAP** — mailto fallback |

---

## Route integrity rules (enforced)

1. **Existing paths preserved untouched:** `app/index.tsx`, `app/login.tsx`, `app/register.tsx`, `app/(tabs)/*`, `app/clinician/*` (13 existing), `app/patient/[id].tsx` + `_layout.tsx`.
2. **Static beats dynamic in Expo Router:** patient self-service lives under `app/patient/my-health/` — a static sub-route namespace that can never collide with `patient/[id].tsx`.
3. `app/patient/my-health/` group layout exists with the same Stack+`headerShown:false` as all new groups.
4. Screening/staff groups with an `index.tsx` serve as their group's landing screen.
5. All new screens are `PagePlaceholder` — builders replace the body, never the route file name (URL stability is a contract). Files may gain `[id].tsx`-style params later, but the flat names above are frozen for this phase.

## Supporting primitives (already in `apps/expo/components/`)

`Screen`, `Button`, `Card`, `StatusBadge`, `EmptyState`, `Loading`, `MetricBar`, `SignalCard`, `TimelineItem` (pre-existing) + **new:** `ScreenHeader`, `SectionCard`, `DetailRow`, `ListRow`, `Stat`, `RiskBadge`, `PagePlaceholder` (Phase 2 shared UI kit).

## Gates (must be green before handoff)

```bash
pnpm --filter @baseline/expo typecheck
pnpm --filter @baseline/expo lint
```

**No new npm packages.** If a screen needs a capability that doesn't exist (camera/QR), the builder must flag it in the PR rather than add a dependency.
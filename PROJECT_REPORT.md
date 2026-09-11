# CareGuardian (BASELINE) — Full Project Report

> **AI-Powered Persistent Health Memory for Elderly Patients**
> "Understand what changed before it becomes a crisis."

---

## 1. Overview

CareGuardian is a **multi-role, AI-assisted elderly care platform**. It maintains a **persistent, longitudinal "health memory"** per patient — collecting observations from family caregivers, professional caregivers, guardians, clinicians, and pharmacists, then using **baseline analytics + LLM (Gemini)** to detect *what changed* vs. the patient's personal baseline and flag it *before it becomes a crisis*.

Care is organized around a **Care Circle** (patient + caregivers + guardians + clinicians), with **consent-based access control**, a full **audit trail**, emergency data access, medication contradiction detection, and an AI clinical-brief generator.

**Product repo:** `github.com/mittai17/CareGaurdian`
**Branch:** `main`

---

## 2. Tech Stack (Complete)

| Layer | Technology | Version / Notes |
|---|---|---|
| **Language (core)** | TypeScript | >= 5.5 (Node >= 20, pnpm >= 9) |
| **Monorepo** | pnpm workspaces | `pnpm-workspace.yaml` — `apps/*`, `packages/*` |
| **Backend API** | NestJS (Express) | ^10.4 — modular monolith |
| **ORM / DB access** | Prisma | ^5.20 (preview: `postgresqlExtensions`) |
| **Database** | PostgreSQL 16 + **pgvector** | Production: **Neon** (serverless, `neondb`); local: `pgvector/pgvector:pg16` Docker |
| **ML Service** | Python / FastAPI | uvicorn, numpy, pandas, scikit-learn, pydantic |
| **LLM / AI** | Google Gemini (`@google/genai` ^2.21) + LangChain **LangGraph** | Wrapped in `@baseline/ai` gateway w/ deterministic `MockProvider` fallback |
| **Web frontend** | Next.js ^14.2 (App Router) + React 18 | TailwindCSS ^3.4, Radix UI, TanStack React Query, Recharts, React Flow, Axios |
| **Mobile frontend** | Expo Router | Scaffolded/managed by separate mobile docs (`apps/expo` docs) — planned surface |
| **Auth** | JWT (`@nestjs/jwt` + `passport-jwt`), bcrypt | Session table tracks token hashes; role-based guards |
| **Realtime** | Socket.IO (NestJS `@nestjs/websockets` + `platform-socket.io`) | `/notifications` namespace push |
| **Jobs/queues** | BullMQ + ioredis | Available (Redis-backed) |
| **Object storage** | MinIO (S3-compatible) | Document uploads / signed URLs |
| **API docs** | Swagger / OpenAPI (`@nestjs/swagger`) | Served at `/docs` |
| **Validation** | class-validator / class-transformer, zod | API pipes (whitelist+transform), zod in `@baseline/ai` |
| **Security** | `@nestjs/throttler` (rate limit 300 req/min), CORS credentials, encryption key env | ANG: `ENCRYPTION_KEY` for sensitive fields |
| **Testing** | Jest + ts-jest (API), pytest (ML), ESLint, Prettier | |

### Package workspaces

| Package | Purpose |
|---|---|
| `apps/api` | NestJS backend (`@baseline/api`) — all domain modules, Prisma, seed scripts |
| `apps/web` | Next.js clinician/nurse/caregiver web app (`web`) |
| `packages/ai` | `@baseline/ai` — LLM gateway (Gemini/Mock), dosage-check agent |
| `packages/types` | `@baseline/types` — shared TS types |
| `packages/api-client` | `@baseline/api-client` — API base URL helper |
| `packages/config` | shared config stub |
| `packages/validation` | shared zod/validation stubs |
| `packages/ui` | shared UI primitives (stub) |
| `services/ml` | Python FastAPI ML service (baseline, anomalies, episodes, transform) |

---

## 3. System Architecture

```
                          ┌─────────────────────────────────────────────────┐
                          │                    CLIENTS                      │
                          │   Next.js Web (apps/web)   ·   Expo Mobile      │
                          └───────┬───────────────────────────┬─────────────┘
                                  │  REST /api/v1 (JWT)         │ Socket.IO
                                  ▼                             ▼
                    ┌───────────────────────────┐   ┌──────────────────────────┐
                    │      apps/api (NestJS)    │   │ WS /notifications         │
                    │  Modular monolith         │   │ (realtime push to user)   │
                    │  global prefix /api/v1    │   └──────────────────────────┘
                    │  JWT guard + Roles guard  │
                    │  Access-Control (consent) │
                    └───┬─────────┬─────────┬───┘
                        │         │         │
        ML calls        │         │ Prisma  │ Object storage
        (pydantic)      ▼         ▼         ▼
              ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
              │ services/ml   │ │  PostgreSQL  │ │  MinIO (S3)  │
              │ FastAPI :8001 │ │  Neon / pg-  │ │  :9000/:9001 │
              │ baseline &    │ │  vector      │ └──────────────┘
              │ anomaly det.  │ │  production  │
              └───────────────┘ └──────────────┘
                        │
                        ▼
              ┌───────────────────────────────┐
              │  packages/ai (@baseline/ai)   │
              │  GeminiProvider (GEMINI_API_KEY)│  ← LLM analysis, briefs,
              │  MockProvider (offline fallback)│    dosage checks, summaries
              └───────────────────────────────┘
                        │
                        ▼
              ┌───────────────────────────────┐
              │  Redis (BullMQ queue/cache)   │
              └───────────────────────────────┘
```

### Data flow — observation → alert (the core loop)

1. A caregiver/patient/clinician records an **Observation** (`POST /patients/:id/observations`) — free text + category/severity.
2. NestJS persists it and calls `@baseline/ai` → `AIGatewayService.analyzeObservation()` to extract structured features & a clinical summary.
3. The **ML service** (`POST /baseline/compute`, `POST /anomalies/detect`, `POST /anomalies/change`) recomputes **personal baselines** and flags **deviations** against the patient's own history (per-metric: cognition, mobility, sleep, appetite, medication adherence, etc.).
4. **Change-detection** module (`POST /patients/:id/change-detection/run`) runs change agents, produces **RiskSignals** with evidence, confidence, severity, and `requiresHumanReview`.
5. **Episodes** are grouped health-event clusters; `episodes/match` finds **historical matches** (similar past episodes) to predict trajectory.
6. AI generates a **clinical brief** (`GET /patients/:id/clinical-brief`) / **What Changed** summary for the clinician.
7. **Contradictions** (e.g., conflicting med/condition data) and **missing-information** gaps are detected per patient.
8. Clinicians, guardians & caregivers receive **notifications** (REST + Socket.IO push) and can review signals (feedbacks recorded).

---

### Architecture Flow Diagrams

#### A. Client → API request lifecycle (HTTP + JWT)

```
  Browser / Mobile                    NestJS API (:3010)                     DB / Redis
      │                                     │                                  │
      │ 1. POST /auth/login                 │                                  │
      │    {email, password} ───────────────▶ bcrypt.verify(passwordHash)      │
      │                                     │ ◄─── read User ──────────────────┤
      │                                     │ sign JWT (secret, issuer, exp)   │
      │                                     │ store Session {tokenHash,IP,UA}   │
      │ ◄──── { accessToken, user } ────────┤ ◄─── persist Session ────────────┤
      │                                     │                                  │
      │ 2. GET /api/v1/patients/:id          │                                  │
      │    Authorization: Bearer <JWT> ────▶ │ JwtAuthGuard → verify token      │
      │                                     │ RolesGuard → check @Roles()       │
      │                                     │ AccessControl → consent check     │
      │                                     │ AuditLog.create(actor,purpose)    │
      │                                     │ ◄─── read Patient ────────────────┤
      │ ◄──────── 200 { patient } ──────────┤                                  │
      │                                     │                                  │
      │ 3. on 401 → client surfaces         │                                  │
      │    "session expired" screen          │                                  │
```

#### B. Observation ingestion → AI enrichment → baseline deviation

```
Caregiver            NestJS API                 @baseline/ai (Gemini)        ML service (:8001)          Neon (pgvector)
   │                     │                             │                          │                        │
   │ POST /patients/:id/ │                             │                          │                        │
   │ observations        │                             │                          │                        │
   │ {rawText,category,  │                             │                          │                        │
   │  severity} ─────────▶ persist Observation ────────▶ persist ────────────────────────────────────────────┤
   │                     │     │                       │                          │                        │
   │                     │     ├──────────────────────▶ analyzeObservation()      │                        │
   │                     │     │                       │ ├── Gemini structured    │                        │
   │                     │     │                       │ │     extraction (zod)   │                        │
   │                     │     │                       │ └── or Mock fallback     │                        │
   │                     │     │ ◄── structured JSON ──┤                          │                        │
   │                     │     ├──────────────────────────────────────────────────▶ /baseline/compute       │
   │                     │     │                                                    /anomalies/change      │
   │                     │     │ ◄──────── deviations / z-scores ──────────────────┤                        │
   │                     │     │                       │                          │                        │
   │                     │     ├──────────────────────▶ generateChangeSummary()   │                        │
   │                     │     │                       │                          │                        │
   │                     │     │ create RiskSignal (severity, confidence,          │                        │
   │                     │     │   requiresHumanReview, evidenceIds) ──────────────▶ persist ───────────────┤
   │ ◄── 201 + summary ──┤     │                       │                          │                        │
   ```

#### C. Change-detection / alerting pipeline

```
   POST /patients/:id/change-detection/run
        │
        ▼
┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐    ┌──────────────────┐
│ Gather evidence │    │ Run change agents│    │ Baseline compare  │    │ Episodes match   │
│ observations,   │───▶│ (per metric)     │───▶│ vs personal       │───▶│ past episodes →  │
│ events, meds,   │    │ SIGNAL           │    │ baselines (ML)    │    │ trajectory/hist. │
│ labs, timeline  │    └──────────────────┘    └───────────────────┘    └──────────────────┘
└─────────────────┘                                                   │
                                                                      ▼
┌──────────────────┐   ┌────────────────────┐   ┌──────────────────────────────┐
│ RiskSignal       │◀──│ Contradictions &   │   │ Clinical brief (AI)           │
│ severity+conf.   │   │ missing-info gaps  │   │ /what-changed summary         │
│ requiresReview   │   └────────────────────┘   └──────────────────────────────┘
└────────┬─────────┘
         ▼
   NotificationService -> REST row + Socket.IO emit to user:<clinicianId>
         ▼
   Clinician reviews signal -> ClinicianFeedback {verdict} -> AuditLog
```

#### D. Consent & access-control flow

```
 Guardian / Patient                 API                        Neon
    │ POST /consents                 │                          │
    │ {recipientId, dataScope,       │ create Consent= PENDING  │
    │  purpose, expirationDate} ─────▶ persist ──────────────────┤
    │                                │                          │
    │ POST /consents/:id/approve ────▶ Consent= APPROVED        │
    │                                │ Permission rows created  │
    │                                │ (resource x action)      │
    │                             ...│                          │
 Recipient                          │                          │
    │ GET /patients/:id/observations │                          │
    │  ─────────────────────────────▶│ AccessControlService     │
    │                                │  check consent + scope   │
    │                                │  ├─ allowed  → data      │
    │                                │  ├─ missing  → 403/deny  │
    │                                │  └─ AuditLog created     │
    │                                │                          │
    │ POST /consents/:id/revoke ─────▶ Consent= REVOKED ────────▶ effective immediately
```

#### E. Document pipeline (MinIO + pgvector RAG)

```
 Client                     API (:3010)                  MinIO (:9000)             Neon (pgvector)
   │  POST /patients/:id/     │                               │                        │
   │  documents (multipart) ──▶ 1. store file ────────────────▶ object storage         │
   │                           │ 2. parse text (PDF/DOCX)     │                        │
   │                           │ 3. chunk text                │                        │
   │                           │ 4. embed → vector(384) ──────▶ DocumentChunk row      │
   │  GET /documents/:id/      │                               │                        │
   │  signed-url ─────────────▶│ 5. generate presigned URL ────▶                        │
   │ ◄── 302/URL ──────────────┘                               │                        │
```

#### F. Real-time notifications (Socket.IO)

```
 Client                                   NestJS (WS /notifications)
   │  socket.connect()                        │
   │  ───────────────────────────────────────▶│ afterConnection
   │  emit "join", {userId}                   │
   │  ───────────────────────────────────────▶│ join room `user:<userId>`
   │                                          │
   │  [signal created on patient]             │
   │            NotificationService ────────▶│ emitToUser(userId, payload)
   │  ◄──────── "notification" event ─────────│
```

#### G. Messaging (care-team chat)

```
 Sender                 API                          Receiver                    Neon
   │  POST /messages      │                              │                         │
   │  {receiverId,        │                              │                         │
   │   content, patientId} ▶ validate + persist Message ──▶ (delivered via          │
   │  ◄─ 201 ───────────────┤                             │  message feed /          │
   │                        │  senderId / receiverId ─────▶ notifications)          │
   │  GET /messages/       │                              │                         │
   │  conversations /      │  conversations:              │                         │
   │  thread/:partnerId    │  threads grouped per user ────▶ read ──────────────────┤
```

#### H. Emergency access flow

```
 Emergency clinician                  API                            Neon
   │  GET /patients/:id/            │                                │
   │  emergency-summary ────────────▶ 1. verify EmergencyAccess       │
   │                                │    (or create w/ reason+expiry)│
   │  POST /patients/:id/           │ 2. return emergency card:       │
   │  emergency-access ─────────────▶    allergies, meds, conditions, │
   │                                │    recent hospitalizations,     │
   │                                │    contacts                     │
   │                                │ 3. EmergencyAccess expires      │
   │                                │    (time-boxed, audited)        │
   │  GET /emergency/               │                                │
   │  access-log/:patientId ────────▶ read log ───────────────────────┤
```

#### I. Deployment / runtime topology (dev compose)

```
 localhost:3001 ─────────────┐
 Next.js (web, dev)          │
                             │
 localhost:8083 ─────────────┤
 Next.js (web, prod build)   │        ┌─────────────────────────┐
                             │        │  apps/api :3010         │
 localhost:3010 ─────────────┼───────▶│  NestJS + Prisma        │────▶ Neon PostgreSQL
 REST + WS + Swagger         │        └────────┬────────────────┘         (pgvector)
                             │                 │ ML / HTTP
 localhost:8001 ─────────────┘        ┌────────▼────────────────┐
 FastAPI ML service                  │  services/ml :8001      │
                                     └─────────────────────────┘
 Docker (compose):  pgvector pg16 :5434  ·  redis :6380  ·  minio :9000/:9001
```

---

## 4. API — Base URLs

| Service | URL (dev) | Docs / Notes |
|---|---|---|
| **REST API (NestJS)** | `http://localhost:3010/api/v1` | `API_PORT=3010`; fallback default `3000` |
| **Swagger / OpenAPI** | `http://localhost:3010/docs` | Auto-generated, Bearer auth |
| **ML service (FastAPI)** | `http://localhost:8001` | `GET /health` |
| **Web app (dev)** | `http://localhost:3001` | `next dev -p 3001` |
| **Web app (prod build)** | `http://localhost:8083` | `next start -p 8083` |
| **Web Socket notifications** | `ws://localhost:3010/notifications` | Socket.IO namespace |
| **MinIO console** | `http://localhost:9001` | `minioadmin / minioadmin` |
| **Prisma Studio** | `http://localhost:5555` | `pnpm db:studio` |

### Infra ports (docker-compose)

| Container | Image | Host port | Service |
|---|---|---|---|
| `baseline-postgres` | `pgvector/pgvector:pg16` | **5434**:5432 | Neon/postgres |
| `baseline-redis` | `redis:7-alpine` | **6380**:6379 | Redis/BullMQ |
| `baseline-minio` | `minio/minio` | **9000** (S3) + **9001** (console) | Object storage |

> **Production DB** is **Neon PostgreSQL** (serverless, `DATABASE_URL` in `.env`). Redis & MinIO run locally via Docker.

---

## 5. API Endpoint Catalog (`http://localhost:3010/api/v1`)

### Auth & Users
| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create account (bcrypt hash, role) |
| POST | `/auth/login` | Login → JWT access token |
| GET | `/auth/me` | Current user profile |
| POST | `/auth/logout` | Revoke current session |
| GET | `/users/me` | Current user detail |
| GET | `/users/:id` | Get user by id |
| PATCH | `/users/:id` | Update user |
| GET | `/roles` | List roles |

### Patients & Care Circle
| Method | Route | Description |
|---|---|---|
| POST | `/patients` | Create patient |
| GET | `/patients` | List patients (all / relation-filtered) |
| GET | `/patients/:id` | Patient detail |
| PATCH | `/patients/:id` | Update patient |
| GET | `/patients/:id/summary` | **Health dashboard summary** |
| GET | `/patients/:id/care-circle` | Care Circle members |
| GET | `/patients/:id/timeline` | Full timeline (optional `?year=`) |

### Health Records (patient-scoped)
| Method | Route | Description |
|---|---|---|
| GET/POST | `/patients/:id/memory` + `GET /memory/:id` | Persistent health memory |
| GET/POST | `/patients/:patientId/events` + `GET /events/:id` | Health events |
| GET/POST | `/patients/:id/observations` + `GET /observations/:id` | Observations (caregiver input) |
| GET/POST | `/patients/:patientId/medications`, `PATCH /medications/:id`, `POST .../medication-events` | Medications + adherence events |
| GET/POST | `/patients/:patientId/conditions` + `PATCH /conditions/:id` | Conditions |
| GET/POST | `/patients/:patientId/allergies` + `PATCH /allergies/:id` | Allergies |
| GET/POST | `/patients/:patientId/encounters` | Hospital visits / encounters |
| GET/POST | `/patients/:patientId/lab-results` + `GET /lab-results/:id` | Lab results |

### Intelligence Layer
| Method | Route | Description |
|---|---|---|
| GET/POST | `/patients/:id/baseline` + `POST .../baseline/recompute` | Personal baseline metrics |
| GET | `/patients/:id/health-graph` | Health change graph |
| GET/POST | `/patients/:id/episodes` + `GET /episodes/:id` + `GET .../episodes/match` | Episodes & historical match |
| POST/GET | `/patients/:id/change-detection/run`, `GET /patients/:id/changes`, `GET /changes/:id` | **What changed** / risk signals |
| GET/POST | `/patients/:id/contradictions` + `POST .../contradictions/detect` | Med/data contradictions |
| GET/POST | `/patients/:id/missing-information` + `POST .../missing-information/detect` | Data gaps |
| GET | `/patients/:id/clinical-brief`, `GET /brief/:id` | **AI clinical brief** |
| GET | `/patients/:id/what-changed`, `/patients/:id/year-timeline` | Brief helpers |

### AI Endpoints (`@baseline/ai`)
| Method | Route | Description |
|---|---|---|
| POST | `/ai/analyze-event` | LLM extracts structured data from event |
| POST | `/ai/clinical-brief` | Generate clinical brief sections |
| POST | `/ai/query` | Free-form AI assistant query |
| POST | `/ai/dosage-check` | Medication dosage check agent |

### Access, Consent, Emergency, Comms
| Method | Route | Description |
|---|---|---|
| POST | `/guardians`, `GET /guardians/patients/:patientId`, `POST /guardians/:id/revoke` | Guardian/caregiver relationships |
| POST | `/consents`, `GET /patients/:patientId/consents`, `POST /consents/:id/approve`, `POST /consents/:id/revoke` | Consent lifecycle (PENDING→approved/revoked) |
| GET | `/audit` | Audit log |
| GET | `/patients/:id/emergency-summary` | Emergency summary card |
| POST | `/patients/:id/emergency-access` | Emergency access grant |
| GET | `/emergency/access-log/:patientId` | Emergency access log |
| GET/POST | `/patients/:patientId/documents`, `POST .../documents/text`, `GET /documents/:id`, `GET /documents/:id/signed-url`, `GET /documents/:id/content` | Document upload / parsing / retrieval |
| GET | `/notifications` + `POST /notifications/:id/read` | Notifications (REST) |
| WS | `/notifications` (Socket.IO) | Realtime push to `user:<id>` room |
| GET | `/messages/conversations`, `/messages/thread/:partnerId`, `/messages/feed`, `POST /messages` | Care team messaging |

### ML Service (`http://localhost:8001`)
| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/baseline/compute` | Compute personal baseline from observations |
| POST | `/anomalies/detect` | Anomaly detection on metric series |
| POST | `/anomalies/change` | Deviation-from-baseline detection |
| POST | `/episodes/similarity` | Episode similarity / historical matches |
| POST | `/transform/text-to-features` | Text → feature vector transform |

---

## 6. Database Schema (Prisma — Neon PostgreSQL + pgvector)

31 models / 8 role enums / enums: `VerificationStatus`, `ConfidenceLevel`, `Severity` (NORMAL→CRITICAL), `SignalType`, `EventType` (21 event types incl. FALL, HOSPITALIZATION, MISSED_MEDICATION…), `SourceType`, `MemoryType`, `ObservationCategory`, `BaselineMetricType` (12 metrics incl. cognition, mobility, ADLS, blood pressure, glucose).

**Core models**

| Model | Purpose |
|---|---|
| `User` | Multi-role (`UserRole[]`), email, handle, passwordHash, MFA flags, org membership |
| `Session` | JWT token hashes, IP/UA, expiry, revocation |
| `Patient` | Demographics, emergency contacts, timezone/language, dementia stage |
| `PatientUserRelationship` | Role-bound relation user↔patient |
| `GuardianRelationship` | Guardian/caregiver links to patient (starts/ends/documentRef/status) |
| `Organization` / `OrganizationMembership` / `PatientOrganizationRelationship` | Org + memberships |
| `Observation` | Free-text + structured JSON, category, severity, source |
| `HealthEvent` | Canonical event stream (21 types), confidence, metadata, links to episodes |
| `HealthMemoryFact` | Extracted persistent facts w/ provenance |
| `Baseline` + `BaselineMetric` | Per-patient personal baselines (value, stdDev, sample size, confidence) |
| `RiskSignal` | AI agent output: severity, confidence, evidenceIds, contradictions, dataGaps, `requiresHumanReview` |
| `Episode` | Grouped event clusters w/ symptoms, meds involved, functional/cognitive changes |
| `Document` + `DocumentChunk` | Uploaded docs + chunks with **vector(384) embeddings** (pgvector) |
| `Consent` + `Permission` | Data-scope consents between grantor/recipient with resources+actions |
| `AuditLog` | Every access/action (actor, purpose, result) |
| `AgentRun` | LLM/agent execution tracking |
| `Evidence` / `Contradiction` / `MissingInformation` | Signal supporting evidence, data contradictions, gaps |
| `EmergencyAccess` | Emergency data-access grants with expiry |
| `Notification` / `ClinicianFeedback` / `Message` / `Handover` | Comms, feedback on signals, staff handover with AI summary |

---

## 7. Working Flow by Role (User Journeys)

- **Patient** ⤏ Health dashboard (summary), health memory, timeline, meds, check-ins, consents, emergency card, documents.
- **Family / Professional Caregiver** ⤏ Dashboard of patients, "report change" (text or voice → observation), today's care tasks, medication/adherence, patient timeline, recent changes, access permissions.
- **Guardian** ⤏ Patient overview, health memory/timeline, medication oversight, **consent & access management** (approve/revoke), caregiver activity, emergency info.
- **Clinician** ⤏ Patient list → per-patient: **What Changed**, personal **baseline (cognitive)**, health change **graph**, **episodes** + historical match, **medication intelligence** & **interactions**, **missing information**, **AI clinical brief**, evidence explorer, care-circle, audit history, **AI assistant**.
- **Pharmacist** ⤏ Medication overview, medication **risk review** (contradictions), interactions, adherence, consent.
- **Emergency clinician** ⤏ Patient lookup / QR → **emergency summary** (critical allergies, meds, conditions, recent hospitalizations, emergency contacts) with access-confirmation + expiry.
- **Admin** ⤏ Audit log, care team, consent tracking, caregiver/clinician/pharmacist activity, system health, feature flags, roles & permissions.

---

## 8. AI & ML Pipeline

- **`@baseline/ai`** gateway (`packages/ai/src`): `GeminiProvider` (real LLM, `GEMINI_API_KEY`) with automatic fallback to `MockProvider` (deterministic, offline). Entry point `AIGatewayService` → `analyzeObservation`, `generateChangeSummary`, `generateClinicalBrief`, plus `dosage-check.agent` (LangGraph). Output is validated with zod.
- **`services/ml`** (FastAPI, scikit-learn): personal baseline computation, anomaly detection, deviation-from-baseline, episode similarity, text→feature transform. Port **8001**.
- **Change detection**: heuristic/agent pipeline → `RiskSignal` rows flagged `requiresHumanReview`; clinicians can give feedback (`ClinicianFeedback`).

---

## 9. Auth, Security & Compliance

- **JWT bearer** auth (`passport-jwt`) on all protected routes; `@Public()` decorator for open endpoints.
- **Role-based guards** (`RolesGuard`, `@Roles(...)` decorator) over 8 roles.
- **Consent-based access control** (`AccessControlService`) — data access gated by active consents & permissions; revocations enforced.
- **Complete audit trail** (`AuditLog`) recording actor, patient, action, purpose, result.
- **Rate limiting** (300 req / 60s), CORS with credentials, whitelist/transform validation pipe.
- **MFA scaffolding** (mfaSecret/mfaEnabled flags) and session revocation.
- Passwords bcrypt-hashed; NEON + `sslmode=require`; S3 MinIO signed URLs; encryption key env for field encryption.
- **Privacy docs shipped**: privacy policy, data processing agreement, AI transparency, medical disclaimer, cookie policy, responsible disclosure (see `docs/frontend-pages.md`).

---

## 10. Repo Layout

```
CareGaurdian/
├── apps/
│   ├── api/            # NestJS backend + Prisma + seed scripts
│   │   └── prisma/     # schema.prisma, migrations, seed*.ts
│   └── web/            # Next.js web app (Next 14 App Router)
├── packages/
│   ├── ai/             # @baseline/ai  LLM gateway (Gemini/Mock)
│   ├── api-client/     # API URL helper
│   ├── config/ types/ validation/ ui/
├── services/ml/        # Python FastAPI ML service
├── docs/               # frontend-pages.md (page manifest & API gaps)
├── PROJECT_REPORT.md   # this file
├── credentials.md      # seeded demo account credentials (NEON live)
├── docker-compose.yml  # postgres(pgvector) + redis + minio
├── .env / .env.example # environment config  (⚠️ secrets — keep .env out of git)
├── pnpm-workspace.yaml
└── package.json        # root scripts
```

## 11. Root Scripts (pnpm)

```bash
pnpm start            # start:api + start:web + start:ml (concurrent)
pnpm dev              # Next.js web dev (port 3001)
pnpm dev:api          # NestJS watch (port 3010)
pnpm dev:ml           # uvicorn ml service (port 8001)
pnpm dev:expo         # Expo (planned mobile)
pnpm build / lint / typecheck / test
pnpm db:generate      # prisma generate
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # seed 41 users into Neon
pnpm db:studio        # prisma studio
```

## 12. Environment (`.env`)

| Var | Value (dev) | Notes |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL (SSL) | production DB |
| `REDIS_URL` | `redis://localhost:6380` | Docker |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | MinIO localhost | `baseline-documents` bucket |
| `GEMINI_API_KEY` | set in .env | falls back to MockProvider if absent |
| `ML_SERVICE_URL` | `http://localhost:8001` | |
| `API_PORT` / `API_URL` | `3010` | `http://localhost:3010` |
| `NEXT_PUBLIC_API_URL` / `EXPO_PUBLIC_API_URL` | `http://localhost:3010` | client base URL |
| `AUTH_ISSUER` / `AUTH_CLIENT_ID` / `AUTH_CLIENT_SECRET` | OAuth-ish placeholders | |
| `ENCRYPTION_KEY` | change-me | production must change |
| `NEON_API_KEY` | set in .env | ⚠️ secret |

## 13. Seeded Data (live in Neon)

41 users: **1 admin, 5 clinicians, 15 patients, 20 caregivers**, across orgs (Sunrise Senior Care Centre, CareFirst Neurology Clinic, HeartCare Hospital…). Full credentials list → `credentials.md` (universal demo password **CareSafe2026!**). ⚠️ Contains real credentials — restrict access.

## 14. Documentation Referenced

- `docs/frontend-pages.md` — full page manifest (public/auth/onboarding/patient/caregiver/guardian/clinician/pharmacist/emergency/admin/account/system), API conventions, **API GAPs** (endpoints planned but not yet built: appointments, care-team modules, organizations module, procedures, adherence, FHIR export, account deletion, etc.)

## 15. Roadmap / Known Gaps

- Mobile Expo app (routes scaffolded; backend gaps marked `API GAP` in `docs/frontend-pages.md`).
- Endpoints not yet implemented: appointments, care-plan/tasks, organizations module, procedures, adherence, evidence explorer, feedback endpoints, QR decode, sessions/devices management, data export/FHIR, feature flags, system health endpoint.
- Socket-level auth on notifications gateway (documented as future hardening).
- Production security to-dos: replace placeholder `AUTH_CLIENT_SECRET` / `ENCRYPTION_KEY`, rotate demo credentials, restrict credentials.md access.
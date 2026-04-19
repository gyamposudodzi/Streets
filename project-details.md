# Streets Project Details

Last updated: 2026-04-19

## Purpose

Streets is an age-gated creator booking platform for legal creator services. It supports discovery, creator profiles, approved service listings, upfront payment, platform-held pending funds, booking delivery, chat, reports, disputes, and admin review. The current implementation is a development MVP using FastAPI, SQLite, Next.js, and shared TypeScript packages.

The product uses neutral marketplace language. In-person bookings are supported as generic booking logistics, not as explicit sexual-service, escorting, prostitution, solicitation, or illegal-service workflows.

## Current Runtime Shape

Local backend:

```powershell
$env:PYTHONPATH="backend"
$env:STREETS_CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Marketplace:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
npm.cmd run dev -w @streets/marketplace -- -p 3000
```

Admin:

```powershell
$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:8000"
npm.cmd run dev -w @streets/admin -- -p 3001
```

Development seed accounts:

- `buyer@streets.local`
- `creator@streets.local`
- `admin@streets.local`

## Core Workflow

Buyer flow:

1. Buyer registers or signs in.
2. Buyer browses approved services on the marketplace.
3. Buyer opens a service detail page.
4. Buyer creates a booking.
5. Backend creates a booking event and moves the booking into pending payment.
6. Buyer creates a simulated payment intent.
7. Buyer simulates payment success.
8. Backend creates held funds and ledger entries.
9. Creator accepts or declines the booking.
10. If declined, held funds are refunded to the buyer.
11. If accepted, creator marks the booking in progress.
12. Creator marks the booking delivered.
13. Booking enters awaiting release with a release target timestamp.
14. Buyer confirms completion or opens a dispute.
15. Admin releases funds or refunds the buyer.

Creator flow:

1. Creator registers or signs in.
2. Creator edits profile.
3. Creator creates services and availability slots.
4. Clean services auto-approve for public discovery.
5. Services matching admin-managed hold rules stay pending until reviewed.
6. Creator views bookings.
7. Creator accepts or declines paid bookings.
8. Accepted bookings can be started and delivered by the creator.

Admin flow:

1. Admin signs in through the admin app.
2. Admin dashboard loads users, creators, services, bookings, reports, and disputes.
3. Admin controls public wording rules and reviews held listings when needed.
4. Admin can accept/cancel bookings when needed.
5. Admin can release or refund held funds.
6. Admin can resolve reports.
7. Admin can resolve disputes by releasing funds or refunding the buyer.
8. Key admin decisions are recorded in audit logs and shown in the admin dashboard.

## Backend API Summary

Base prefix: `/api/v1`

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Creators:

- `GET /creators`
- `GET /creators/{creator_id}`
- `PUT /creators/{creator_id}`
- `GET /creators/{creator_id}/bookings`

Services:

- `GET /services`
- `GET /services/{service_id}`
- `GET /services/{service_id}/slots`
- `POST /services/creator/{creator_id}`
- `PATCH /services/creator/{creator_id}/{service_id}`
- `POST /services/creator/{creator_id}/{service_id}/slots`

Bookings:

- `POST /bookings`
- `GET /bookings/{booking_id}`
- `GET /bookings/{booking_id}/events`
- `POST /bookings/{booking_id}/accept`
- `POST /bookings/{booking_id}/decline`
- `POST /bookings/{booking_id}/cancel`
- `POST /bookings/{booking_id}/start`
- `POST /bookings/{booking_id}/deliver`
- `POST /bookings/{booking_id}/complete`
- `POST /bookings/{booking_id}/dispute`

Payments:

- `POST /payments/create-intent`
- `POST /payments/{payment_id}/simulate-success`
- `GET /payments/bookings/{booking_id}`

Messages:

- `GET /messages/bookings/{booking_id}`
- `POST /messages/bookings/{booking_id}`

Reports:

- `POST /reports`

Admin:

- `GET /admin/overview`
- `GET /admin/dashboard`
- `GET /admin/users`
- `GET /admin/creators`
- `GET /admin/services`
- `POST /admin/services/{service_id}/approve`
- `POST /admin/services/{service_id}/reject`
- `GET /admin/bookings`
- `GET /admin/creators/{creator_id}/bookings`
- `POST /admin/bookings/{booking_id}/release`
- `POST /admin/bookings/{booking_id}/refund`
- `GET /admin/reports`
- `POST /admin/reports/{report_id}/resolve`
- `GET /admin/disputes`
- `POST /admin/disputes/{dispute_id}/resolve`
- `GET /admin/audit-logs`
- `GET /admin/moderation-rules`
- `POST /admin/moderation-rules`
- `PATCH /admin/moderation-rules/{rule_id}`

## Domain States

User roles:

- `user`
- `creator`
- `admin`

Fulfillment types:

- `video`
- `audio_call`
- `chat`
- `custom_request`
- `in_person`

Service moderation statuses:

- `pending_review`
- `approved`
- `rejected`

Booking statuses:

- `draft`
- `pending_payment`
- `paid_pending_acceptance`
- `accepted`
- `in_progress`
- `delivered`
- `awaiting_release`
- `disputed`
- `cancelled`
- `released`
- `refunded`

Payment statuses:

- `requires_action`
- `succeeded`
- `failed`
- `refunded`

Held funds statuses:

- `held`
- `released`
- `refunded`

Report statuses:

- `open`
- `reviewing`
- `resolved`
- `dismissed`

Dispute statuses:

- `open`
- `reviewing`
- `resolved`

Dispute resolutions:

- `release`
- `refund`

Audit actions:

- `service.approved`
- `service.rejected`
- `booking.accepted`
- `booking.cancelled`
- `funds.released`
- `funds.refunded`
- `report.resolved`
- `dispute.resolved`
- `moderation_rule.created`
- `moderation_rule.updated`

## Database Tables

Current SQLite and PostgreSQL schema targets include:

- `users`: accounts, roles, age flag, status, and email state.
- `sessions`: development bearer session tokens.
- `creator_profiles`: creator display profile and verification/payout status.
- `services`: bookable creator services with fulfillment type and moderation status.
- `availability_slots`: service-specific availability.
- `bookings`: buyer/creator/service booking record and lifecycle status.
- `booking_events`: timeline of booking lifecycle changes.
- `payments`: simulated provider payment records.
- `held_funds`: creator amount held pending release/refund.
- `ledger_entries`: money movement audit ledger.
- `messages`: booking-scoped chat messages.
- `reports`: moderation reports.
- `disputes`: booking money/fulfillment disputes.
- `audit_logs`: append-only admin action trail for moderation, booking, dispute, and money decisions.
- `moderation_rules`: admin-managed public wording rules used to flag or hold service listings.

## Repository Map

### Root Files

- `.gitignore`: excludes dependencies, build outputs, local env files, SQLite database files, Python caches, and IDE noise.
- `README.md`: high-level project introduction, repo layout, and setup notes.
- `roadmap.md`: status-aware build roadmap with completed, partial, pending, and next-step work.
- `project-details.md`: this file; workflow and file-by-file project map.
- `package.json`: root npm workspace definition and structure-check script.
- `package-lock.json`: npm dependency lockfile.

### Scripts

- `scripts/check-structure.mjs`: validates the expected scaffold directories/files exist.

### Documentation

- `docs/architecture.md`: architecture notes for apps, backend, packages, and infrastructure.
- `docs/engineering-standards.md`: coding standards, naming, documentation, and development expectations.
- `docs/phase-0-checklist.md`: foundation checklist for Phase 0 completion tracking.
- `docs/product-guardrails.md`: policy and language guardrails for compliant marketplace design.

### Infrastructure

- `infra/docker/docker-compose.yml`: local infrastructure definition for backend, marketplace, admin, PostgreSQL, and Redis.

## Backend Files

### Backend Root

- `backend/Dockerfile`: container build definition for the FastAPI backend.
- `backend/requirements.txt`: Python runtime dependencies. Current dependencies are FastAPI, Uvicorn, and HTTPX.
- `backend/db/schema.sqlite.sql`: SQLite development schema.
- `backend/db/schema.sql`: PostgreSQL target schema.
- `backend/tests/test_phase1_api.py`: regression tests for meta, auth, profiles, services, bookings, payments, chat, reports, moderation, lifecycle, and disputes.

### Backend App Entry

- `backend/app/__init__.py`: marks `app` as a Python package.
- `backend/app/main.py`: creates the FastAPI app, configures CORS, includes the API router, and exposes `/health`.

### Core Config

- `backend/app/core/__init__.py`: marks `core` as a package.
- `backend/app/core/config.py`: reads environment settings such as API prefix, SQLite path, default currency, hold minutes, and CORS origins.

### API Router and Dependencies

- `backend/app/api/__init__.py`: marks `api` as a package.
- `backend/app/api/router.py`: combines all route modules under the versioned API router.
- `backend/app/api/dependencies.py`: shared request dependencies for current-user and admin-user authorization.

### API Route Modules

- `backend/app/api/routes/__init__.py`: marks route modules as a package.
- `backend/app/api/routes/meta.py`: returns project phase/status metadata.
- `backend/app/api/routes/auth.py`: registration, login, and current-user endpoints.
- `backend/app/api/routes/creators.py`: creator list/detail/profile update and creator booking lookup.
- `backend/app/api/routes/services.py`: public service discovery, service details, creator service CRUD, and availability slot endpoints.
- `backend/app/api/routes/bookings.py`: booking creation, timeline, accept, cancel, start, deliver, complete, and dispute endpoints.
- `backend/app/api/routes/payments.py`: simulated payment intent, simulated payment success, and booking payment-state endpoints.
- `backend/app/api/routes/messages.py`: booking-scoped message read/write endpoints.
- `backend/app/api/routes/reports.py`: user/creator/admin report creation endpoint.
- `backend/app/api/routes/admin.py`: admin overview, dashboard, users, creators, services, bookings, reports, disputes, release/refund, and moderation actions.

### Domain and Models

- `backend/app/domain/__init__.py`: marks `domain` as a package.
- `backend/app/domain/enums.py`: canonical enums for roles, statuses, fulfillment types, ledger entry types, report statuses, dispute statuses, and service moderation.
- `backend/app/models/__init__.py`: marks `models` as a package.
- `backend/app/models/entities.py`: Pydantic entity models for users, sessions, creators, services, slots, bookings, events, payments, held funds, ledger entries, messages, reports, and disputes.

### Schemas

- `backend/app/schemas/__init__.py`: marks `schemas` as a package.
- `backend/app/schemas/admin.py`: admin overview/dashboard response schemas.
- `backend/app/schemas/audit.py`: audit log response schema.
- `backend/app/schemas/auth.py`: auth request/response schemas.
- `backend/app/schemas/availability.py`: availability slot request/response schemas.
- `backend/app/schemas/bookings.py`: booking create/response/event schemas.
- `backend/app/schemas/common.py`: shared response helpers.
- `backend/app/schemas/creators.py`: creator profile request/response schemas.
- `backend/app/schemas/disputes.py`: dispute create/resolve/response schemas.
- `backend/app/schemas/messages.py`: booking message request/response schemas.
- `backend/app/schemas/meta.py`: metadata response schema.
- `backend/app/schemas/moderation.py`: moderation rule create/update/response schemas.
- `backend/app/schemas/payments.py`: payment intent, payment, held funds, ledger, and booking payment-state schemas.
- `backend/app/schemas/reports.py`: report create/resolve/response schemas.
- `backend/app/schemas/services.py`: service create/update/response schemas.

### Repository Layer

- `backend/app/repositories/__init__.py`: marks `repositories` as a package.
- `backend/app/repositories/sqlite.py`: SQLite repository that initializes schema, runs migrations, seeds development data, and implements all persistence operations for users, sessions, creators, services, slots, bookings, payments, held funds, ledger entries, messages, reports, and disputes.

### Service Layer

- `backend/app/services/__init__.py`: marks `services` as a package.
- `backend/app/services/auth.py`: registration and login logic for development sessions.
- `backend/app/services/audit.py`: helper for recording admin-only audit log entries.
- `backend/app/services/creators.py`: creator profile upsert logic.
- `backend/app/services/services.py`: creator service creation/update and availability slot creation logic.
- `backend/app/services/bookings.py`: booking creation, accept/cancel/start/deliver/complete/dispute business rules.
- `backend/app/services/payments.py`: simulated payment intent, payment success, held funds, ledger creation, admin release, and admin refund logic.
- `backend/app/services/messages.py`: booking participant/admin authorization and message creation.
- `backend/app/services/moderation.py`: public listing compliance scanner using admin-managed rules.
- `backend/app/services/reports.py`: report creation, risk scoring, and status resolution logic.

### Workers

- `backend/workers/__init__.py`: package placeholder for future background worker code.
- `backend/workers/README.md`: explains intended worker responsibilities such as booking expiration, auto-release, notifications, payouts, and moderation scans.

## Marketplace App Files

### Marketplace Config

- `apps/marketplace/package.json`: package metadata and Next.js scripts for the marketplace app.
- `apps/marketplace/next.config.js`: Next.js configuration.
- `apps/marketplace/tsconfig.json`: TypeScript configuration.
- `apps/marketplace/next-env.d.ts`: Next.js generated type reference.
- `apps/marketplace/global.d.ts`: temporary/global declarations needed by the app.

### Marketplace App Router

- `apps/marketplace/app/layout.tsx`: root marketplace HTML/app layout.
- `apps/marketplace/app/globals.css`: marketplace global styles.
- `apps/marketplace/app/page.tsx`: marketplace home page with public discovery content.
- `apps/marketplace/app/auth/page.tsx`: auth page that renders the auth panel.
- `apps/marketplace/app/search/page.tsx`: searchable service discovery page.
- `apps/marketplace/app/services/[serviceId]/page.tsx`: service detail page.
- `apps/marketplace/app/bookings/new/page.tsx`: booking creation page.
- `apps/marketplace/app/bookings/[bookingId]/page.tsx`: booking detail page with payment, lifecycle actions, chat, and event timeline.
- `apps/marketplace/app/creator/page.tsx`: creator dashboard page.

### Marketplace Components

- `apps/marketplace/components/auth-panel.tsx`: client-side registration/login panel using local storage session persistence.
- `apps/marketplace/components/session-status.tsx`: displays current marketplace session state and sign-out control.
- `apps/marketplace/components/booking-form.tsx`: booking creation form for selected services/slots.
- `apps/marketplace/components/payment-panel.tsx`: payment intent and simulated payment success UI plus held funds/ledger display.
- `apps/marketplace/components/booking-actions.tsx`: lifecycle action UI for start, deliver, completion confirmation, and dispute opening.
- `apps/marketplace/components/booking-chat.tsx`: booking-scoped chat and report form.
- `apps/marketplace/components/creator-dashboard.tsx`: creator profile editor, service creation, slot creation, service list, and booking management.

## Admin App Files

### Admin Config

- `apps/admin/package.json`: package metadata and Next.js scripts for the admin app.
- `apps/admin/next.config.js`: Next.js configuration.
- `apps/admin/tsconfig.json`: TypeScript configuration.
- `apps/admin/next-env.d.ts`: Next.js generated type reference.
- `apps/admin/global.d.ts`: temporary/global declarations needed by the app.

### Admin App Router

- `apps/admin/app/layout.tsx`: root admin HTML/app layout.
- `apps/admin/app/globals.css`: admin global styles.
- `apps/admin/app/page.tsx`: admin dashboard page wrapper.

### Admin Components

- `apps/admin/components/admin-dashboard.tsx`: client-side admin app with admin login/register, dashboard loading, service approval/rejection, booking accept/cancel/release/refund, report resolution, dispute resolution, and payment state loading.

## Android Files

- `apps/android/README.md`: Android scaffold notes and intended module direction.
- `apps/android/settings.gradle.kts`: Gradle settings for the Android project.
- `apps/android/build.gradle.kts`: top-level Gradle build file placeholder.
- `apps/android/gradle.properties`: Gradle properties placeholder.

## Shared Packages

### API Client

- `packages/api-client/package.json`: package metadata for shared API client.
- `packages/api-client/src/index.ts`: typed `fetch` wrappers for marketplace/admin/backend interaction, including auth, creators, services, bookings, payments, messages, reports, disputes, audit logs, moderation rules, and admin actions.

### Types

- `packages/types/package.json`: package metadata for shared TypeScript types.
- `packages/types/src/index.ts`: shared TypeScript domain types for users, creators, services, bookings, payments, held funds, ledger entries, messages, reports, disputes, audit logs, moderation rules, auth sessions, and admin dashboard responses.

### UI

- `packages/ui/package.json`: package metadata for future shared UI components.
- `packages/ui/src/index.tsx`: placeholder shared UI export.

### Utils

- `packages/utils/package.json`: package metadata for shared utilities.
- `packages/utils/src/index.ts`: placeholder shared utility export.

## Current Verification Commands

Backend compile:

```powershell
python -m compileall backend/app backend/tests
```

Structure check:

```powershell
node scripts/check-structure.mjs
```

Marketplace build:

```powershell
npm.cmd run build -w @streets/marketplace
```

Admin build:

```powershell
npm.cmd run build -w @streets/admin
```

Known note: Next.js currently warns that the native Windows SWC package is invalid, then falls back to the WASM compiler and completes builds successfully.

Known note: `pytest` is not currently installed in `.venv`, so backend verification has used Python compile checks and direct FastAPI smoke scripts.

## Important Gaps Before Production

- Replace development auth with production-grade JWT access tokens, refresh token rotation, device/session revocation, and MFA for creators/admins.
- Add real age verification and email/OTP verification.
- Add payment provider abstraction, webhook verification, provider event storage, refunds table, payouts table, and chargeback handling.
- Harden audit logs with request metadata, before/after snapshots, database-level immutability constraints, and full coverage for future admin actions.
- Add prohibited-listing scanner and media moderation hooks.
- Add creator verification, especially for in-person fulfillment.
- Add masked in-person coordination fields and no-public-exact-location rules.
- Add WebSocket chat, Redis fanout, message read receipts, attachments, retention, and moderation scanning.
- Add background workers for booking expiration, auto-release, payout batching, reminders, notifications, and scans.
- Add managed video provider integration.
- Add Android app implementation.
- Add CI, linting, formatting, test runner setup, and deployment hardening.

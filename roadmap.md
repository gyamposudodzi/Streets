# Streets Build Roadmap

Last updated: 2026-04-19

## Product Direction

Streets is an age-gated creator booking platform for legal creator services such as paid video sessions, custom requests, private chat, paid calls, consulting, coaching, entertainment, creator interactions, and neutral in-person bookings.

Platform boundaries:

- No explicit sexual-service wording in product design, listings, categories, seed data, admin tools, or operational flows.
- No prostitution, escorting, solicitation, or illegal-service workflows.
- Product language stays focused on creator services, bookings, communication, moderation, trust, scheduling, delivery, and fulfillment.
- In-person bookings are supported only as neutral logistics workflows with stronger review, safety, and moderation requirements.
- Funds should be described as pending or held funds, not escrow, unless legal review approves that wording.

## Current Build Snapshot

Overall status: Phase 0 is complete. Phase 1 is mostly complete. Parts of Phases 2, 3, and 5 are already implemented in MVP/dev form. Phase 4, Android production work, automation jobs, video, uploads, provider integrations, notifications, and audit-log hardening are still pending.

Completed foundations:

- Monorepo scaffold for marketplace, admin, Android skeleton, backend, shared packages, docs, and infra.
- FastAPI backend with versioned routing.
- SQLite development database with schema creation, migrations, and seed data.
- Next.js marketplace app and Next.js admin app.
- Shared TypeScript API client and shared type package.
- Development auth with user, creator, and admin roles.
- Creator profiles, service listings, service moderation state, admin-managed public wording rules, availability slots, booking creation, booking events, simulated payments, held funds, ledger entries, chat, reports, disputes, and admin release/refund tools.

Partially complete foundations:

- Age gate exists as a registration flag, but there is no production-grade age verification provider.
- Email verification is represented in the data model, but no email/OTP delivery flow exists yet.
- Payment flow is simulated behind an internal provider abstraction with provider-event storage. No real payment service provider, signed webhook verification, payout rails, or chargeback handling exists yet.
- Chat is persisted over HTTP, but WebSockets, Redis fanout, read receipts, attachments, retention rules, and moderation scanning are still pending.
- Disputes exist with full release/refund resolution, and admin audit logs now capture key decisions. Partial refunds, evidence attachments, and admin notes are pending.
- Public listing compliance rules exist with admin-controlled words/phrases. Clean services auto-approve; matched hold rules keep listings out of discovery for review. Media review is pending.
- Admin dashboard exists, but it is still MVP-level and not permission-tiered.

Not started:

- Managed video sessions.
- Background workers for auto-release, reminders, expirations, payouts, notifications, and scans.
- Android feature implementation beyond skeleton.
- Creator KYC/verification integration.
- Production JWT refresh-token rotation, MFA, secrets hardening, rate limits, and observability.

## Recommended Stack

Frontend:

- Web marketplace: Next.js + React + TypeScript.
- Admin dashboard: Next.js + React + TypeScript.
- Shared data fetching: currently direct `fetch` helpers; TanStack Query can be added when client-side state grows.
- UI layer: current custom CSS; Tailwind or Material UI can be introduced later if desired.

Android:

- Kotlin.
- Jetpack Compose.
- MVVM + Repository pattern.
- Feature modules as the app grows.

Backend:

- FastAPI.
- SQLite for development now.
- PostgreSQL for production target.
- Redis for future realtime fanout and job coordination.
- Celery or Dramatiq for future background jobs.
- WebSocket support for chat and presence.
- Object storage for uploads.
- Docker for local/dev/prod consistency.
- Nginx or Caddy as edge proxy.

Realtime and video:

- Managed WebRTC provider for sessions.
- Short-lived room and participant tokens.

Payments:

- Internal payment interface before a real PSP is wired.
- Held-funds ledger model.
- Provider-specific adapters behind a common interface.

## Architecture Targets

High-level domains:

- Auth and identity.
- Creator profiles and listings.
- Booking lifecycle.
- Payments and held funds.
- Chat and attachments.
- Video sessions.
- In-person session logistics.
- Moderation and trust.
- Notifications.
- Admin operations.

Current monorepo shape:

```text
/apps
  /marketplace
  /admin
  /android
/backend
  /app
  /workers
/packages
  /ui
  /api-client
  /types
  /utils
/infra
  /docker
/docs
```

## Phase Status

### Phase 0: Foundation and Guardrails

Status: Complete.

Completed:

- Monorepo/app folder structure created.
- Shared package folders created.
- FastAPI service skeleton with health endpoint and versioned API routing.
- Next.js marketplace and admin app shells.
- Android Gradle skeleton.
- Docker Compose for PostgreSQL, Redis, backend, marketplace, and admin.
- Engineering standards, architecture notes, product guardrails, and phase checklist docs.
- `.gitignore` and scaffold validation script.
- SQLite development path selected for early work.

Partially complete:

- CI pipeline is not configured yet.
- Formatting/lint/test tooling is basic and should be expanded.
- Android Gradle wrapper and real Compose app bootstrap are still pending.

Exit criteria status:

- Web apps build.
- Backend compiles and smoke tests pass.
- Structure is stable enough for feature work.

### Phase 1: Identity, Profiles, Listings, and Basic Booking

Status: Mostly complete for web/backend MVP.

Completed:

- Development registration/login.
- Roles for user, creator, and admin.
- Session persistence in SQLite.
- Age gate flag on users.
- Creator profile creation/update.
- Service listing creation/update.
- Fulfillment types including video, audio call, chat, custom request, and in-person.
- Service discovery, search filters, and service detail pages.
- Service moderation state: pending review, approved, rejected.
- Public discovery hides non-approved services.
- Admin-managed public wording rules.
- Clean services auto-approve; held-rule matches wait for review.
- Availability slot creation/listing.
- Booking creation with draft to pending payment event flow.
- Booking events timeline.
- Creator booking lookup.
- Creator accept/decline decision for paid bookings pending creator acceptance.
- Declined creator bookings automatically refund held funds to the buyer.
- Marketplace home, search, auth, creator dashboard, checkout, and booking detail pages.

Partially complete:

- Email verification fields exist but no real email verification flow exists.
- Age verification is only a boolean flag, not a provider-backed workflow.
- Slot expiration and unpaid booking expiration jobs are pending.
- Creator verification/KYC is not implemented.
- Media galleries and reviews are not implemented.

Remaining build steps:

1. Add production-grade auth tokens, refresh rotation, revocation, and MFA for creators/admins.
2. Add real email verification or passwordless OTP delivery.
3. Add creator verification workflow.
4. Add unpaid booking expiration background job.
5. Add service media and review aggregate models.

### Phase 2: Payments, Held Funds, and Admin Release

Status: Partially complete with simulated payments.

Completed:

- Payment intent creation endpoint.
- Simulated payment success endpoint.
- Internal payment provider interface.
- Simulated payment provider implementation.
- Payment webhook/provider event storage.
- Held-funds records.
- Ledger entries for captured payment, platform fee, held creator funds, release, and refund.
- Admin release/refund endpoints.
- Admin dashboard release/refund buttons.
- Marketplace payment panel for simulated payment intent and success.

Partially complete:

- Webhook signature verification is pending.
- Only the simulated provider exists.
- Refunds/payouts are represented through held funds and ledger state, but dedicated `refunds` and `payouts` tables are pending.
- Reconciliation dashboard is MVP-level through booking payment state.

Remaining build steps:

1. Add real provider adapter skeletons.
2. Add webhook signature verification.
3. Add provider event retry/error handling.
4. Add refunds and payouts tables.
5. Add payout batching and reconciliation views.

### Phase 3: Chat, Delivery, and Booking Completion

Status: Partially complete.

Completed:

- Booking-scoped messages.
- Message persistence.
- Booking chat UI.
- Report creation from booking context.
- Booking lifecycle actions: accept, start, deliver, confirm completion, cancel, dispute.
- Delivery creates a release review window.
- Buyer completion moves booking to delivered and ready for admin/manual release.

Partially complete:

- Chat is HTTP polling/manual refresh style, not WebSocket realtime.
- Attachments and signed upload URLs are pending.
- Read receipts and delivery statuses are pending.
- Notification triggers are pending.
- In-person logistics fields and masked location coordination are not implemented yet.

Remaining build steps:

1. Add WebSocket gateway for live messages.
2. Add Redis pub/sub fanout.
3. Add attachments through signed upload URLs.
4. Add read status and retention controls.
5. Add masked in-person logistics fields and change history.
6. Trigger email/push notifications for booking updates.

### Phase 4: Video Sessions and Time-Based Release Rules

Status: Not started.

Pending:

- Managed video room provider abstraction.
- Video room creation.
- Short-lived video tokens.
- Join/leave metadata.
- Reminder jobs.
- Auto-release scheduler.
- Dispute cutoff before auto-release.

Remaining build steps:

1. Add `video_rooms` and `video_session_events`.
2. Integrate a managed WebRTC provider behind an internal interface.
3. Issue short-lived tokens only for eligible accepted bookings.
4. Track session metadata.
5. Add background jobs for reminders and auto-release.

### Phase 5: Moderation, Disputes, and Trust Operations

Status: Partially complete.

Completed:

- Reports table and API.
- Report risk scoring baseline.
- Admin report list and status updates.
- Service approval/rejection for held listings.
- Admin-managed public wording rules for listing compliance.
- Dispute table and API.
- Booking dispute creation freezes booking into disputed state.
- Admin dispute list in dashboard.
- Admin dispute resolution through release or refund.
- Audit logs for service approval/rejection, booking admin accept/cancel, fund release/refund, report resolution, and dispute resolution.
- Recent audit log visibility in the admin dashboard.

Partially complete:

- Moderation scans are keyword/risk-score MVP only, with admin-managed rules.
- No media moderation.
- Audit logs are append-only at the app level, but stronger database immutability controls and richer metadata are still pending.
- No account suspension/block controls.
- No partial refund or evidence attachment support.

Remaining build steps:

1. Add `moderation_actions`.
2. Expand public wording scanner for service titles/descriptions.
3. Add evidence attachments and admin notes to disputes.
4. Add partial refund support.
5. Add user/creator suspension and listing takedown tools.
6. Harden audit logs with request metadata, before/after snapshots, and database-level immutability constraints.

### Phase 6: Android App

Status: Skeleton only.

Completed:

- Android folder and Gradle settings skeleton.
- Android README.

Pending:

- Gradle wrapper.
- Compose app module implementation.
- Core UI/network/database modules.
- Feature modules for auth, home, search, profile, booking, chat, video, fulfillment, wallet, notifications, settings, and reports.

Remaining build steps:

1. Generate Gradle wrapper.
2. Add Compose app shell and navigation.
3. Add API client and auth storage.
4. Build marketplace discovery and booking flows.
5. Add chat, reports, and booking detail screens.

### Phase 7: Scale, Analytics, and Multi-Provider Expansion

Status: Not started.

Pending:

- Analytics dashboards.
- Provider abstraction expansion.
- Payout batching.
- Search relevance improvements.
- Performance/caching improvements.
- Retention/privacy tooling.
- Observability, metrics, tracing, alerts, and backups.

## Current Workflow

Buyer workflow:

1. Buyer signs in or registers with age confirmation.
2. Buyer browses approved services in the marketplace.
3. Buyer opens a service detail page.
4. Buyer creates a booking.
5. Booking moves from draft to pending payment.
6. Buyer creates a simulated payment intent.
7. Buyer simulates payment success.
8. Funds move into held state with ledger entries.
9. Creator accepts or declines the paid booking.
10. If the creator declines, held funds are refunded to the buyer.
11. If the creator accepts, creator starts and delivers the booking.
12. Buyer confirms completion or opens a dispute.
13. Admin releases or refunds held funds.

Creator workflow:

1. Creator signs in or registers.
2. Creator creates/updates profile.
3. Creator creates services and slots.
4. New services default to pending review.
5. Clean services auto-approve; admin reviews only held public-wording matches.
6. Creator sees bookings.
7. Creator accepts or declines paid bookings.
8. Creator marks work in progress and delivered.

Admin workflow:

1. Admin signs in.
2. Admin reviews users, creators, services, bookings, reports, and disputes.
3. Admin approves or rejects services.
4. Admin accepts/cancels bookings when needed.
5. Admin releases or refunds held funds.
6. Admin resolves reports.
7. Admin resolves disputes through release or refund.

## Immediate Next Build Order

Recommended next steps from the current codebase:

1. Expand public-listing compliance scanning during service create/update.
2. Add dispute evidence fields and admin notes.
3. Add real payment provider adapter skeletons and webhook signature verification.
4. Add unpaid booking expiration and auto-release background job skeletons.
5. Add notification records and email/push adapter skeletons.
6. Add in-person logistics fields behind neutral language and masked coordination rules.
7. Add creator verification workflow, especially for in-person fulfillment.
8. Harden audit logs with request metadata and database-level immutability constraints.
9. Add WebSocket chat and attachment upload.
10. Start video room provider abstraction.

## Cross-Cutting Technical Work

Still required before production:

- JWT access token and refresh rotation.
- MFA for creators and admins.
- Signed upload URLs.
- Row-level authorization hardening.
- Rate limiting.
- Webhook signature verification.
- Secrets management.
- Encryption in transit and deployment hardening.
- Privacy-safe display and messaging rules.
- Observability: logs, metrics, tracing, alerting.
- Backups and disaster recovery.

## Compliance Workstream

This should run in parallel with engineering:

- Terms of service.
- Privacy policy.
- Acceptable use policy.
- Creator agreement.
- Refund and dispute policy.
- Recording consent policy.
- Minimum age enforcement rules.
- Moderation review SOPs.
- Prohibited listings engine specification.

Product positioning notes:

- Keep Android and public web positioning centered on creator marketplace and legal creator services.
- Avoid explicit sexualized taxonomy, labels, or marketing copy.
- Keep in-person workflows generic and logistics-oriented.
- Ensure moderation and listing review are active before broad creator onboarding.

## In-Person Trust and Safety Requirements

In-person bookings are supported only with neutral language and stronger controls.

Required before public launch of in-person bookings:

- Manual review for in-person listings.
- Stronger creator verification.
- Masked coordination and no public exact location fields.
- Admin-visible booking logistics timeline.
- Dispute intake and admin resolution.
- Audit logs for meeting detail changes and release decisions.
- Prohibited listing detection.
- Safety/report shortcut in active booking detail screens.

Recommended in-person logistics fields:

- `meeting_mode`
- `location_visibility_status`
- `meeting_window_start`
- `meeting_window_end`
- `check_in_status_buyer`
- `check_in_status_creator`
- `completion_evidence_status`
- `safety_flag_status`

Recommended meeting mode values:

- `creator_location`
- `buyer_location`
- `mutual_venue`
- `to_be_confirmed`

## Definition of MVP

The MVP is complete when:

- Users can register, verify age, browse approved creators/services, and book a service.
- Creators can create profiles, publish clean auto-approved services, resolve held listing wording with admin review when needed, accept bookings, and fulfill through chat, custom delivery, scheduled session, or neutral in-person booking flow.
- Buyers can pay up front and funds remain held pending release/refund.
- Admins can review creators, moderate listings, release/refund funds, and resolve disputes manually.
- Core trust and compliance controls exist across auth, listings, payments, communications, disputes, and audit logs.

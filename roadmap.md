# Streets Build Roadmap

## Product Direction

Streets is an age-gated creator booking platform for legal creator services such as paid video sessions, custom requests, private chat, paid calls, consulting, coaching, entertainment, creator interactions, and in-person bookings.

Platform boundaries:

- No explicit sexual-service wording in product design, listings, categories, or operational flows
- No prostitution or escorting workflows
- Product language should stay focused on creator services, bookings, communication, moderation, trust, scheduling, and fulfillment

## Platform Scope

We will build:

- Web marketplace
- Admin dashboard
- Android app
- Backend APIs and async workers
- Real-time chat and managed video integration
- Held-funds payment and release workflows
- Support for remote and in-person fulfillment workflows

## Recommended Stack

### Frontend

- Web marketplace: Next.js + React + TypeScript
- Admin dashboard: Next.js + React + TypeScript
- Shared data fetching: TanStack Query
- UI layer: Tailwind CSS or Material UI

### Android

- Kotlin
- Jetpack Compose
- MVVM + Repository pattern
- Modular feature-based structure

### Backend

- FastAPI
- PostgreSQL
- Redis
- Celery or Dramatiq for background jobs
- WebSocket support for chat and presence
- Object storage for uploads
- Docker for local/dev/prod consistency
- Nginx or Caddy as edge proxy

### Realtime

- Managed WebRTC provider for sessions
- Short-lived room and participant tokens

### Payments

- Payment provider abstraction from day one
- Internal held-funds ledger model
- Provider-specific adapters behind a common interface

## Architecture Targets

High-level domains:

- Auth and identity
- Creator profiles and listings
- Booking lifecycle
- Payments and held funds
- Chat and attachments
- Video sessions
- In-person session logistics
- Moderation and trust
- Notifications
- Admin operations

Suggested monorepo shape:

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
  /nginx
/docs
```

## Delivery Principles

- Build web first, then Android
- Keep payment logic decoupled from booking orchestration
- Treat moderation, age gate, audit logs, and policy enforcement as MVP work, not polish
- Use neutral creator-marketplace language across UX, APIs, seed data, and documentation
- Support both online and in-person fulfillment behind neutral service and booking models
- Avoid naming funds flow as "escrow" unless legal counsel approves that terminology
- Prefer manual admin controls before automating release and dispute decisions

## Phase Plan

## Phase 0: Foundation and Guardrails

Goal: create the repo structure and operational rules before feature work starts.

Deliverables:

- Monorepo/app folder structure created
- Shared coding standards and naming conventions documented
- Environment configuration strategy
- Docker-based local development setup
- Initial CI pipeline
- Compliance-first product language guide
- Core policy docs backlog defined

Build steps:

1. Create app folders for `apps/marketplace`, `apps/admin`, `backend`, and `apps/android`.
2. Add shared package folders for types, UI, utilities, and API client code.
3. Set up FastAPI service skeleton with health endpoint and versioned API routing.
4. Set up Next.js marketplace app and admin app shells.
5. Add Android project scaffold with Compose, MVVM, and initial feature modules.
6. Add Docker Compose for PostgreSQL, Redis, backend, and web apps.
7. Add linting, formatting, and test tooling for TypeScript, Python, and Kotlin.
8. Document product guardrails, prohibited listing patterns, and safe naming rules.

Exit criteria:

- All apps boot locally
- CI runs lint/test placeholders successfully
- Repo structure is stable enough for feature work

## Phase 1: Identity, Profiles, Listings, and Basic Booking

Goal: ship the first usable web MVP for discovery and booking creation.

Deliverables:

- User registration and login
- Email verification
- 18+ age gate
- Creator onboarding
- Creator profile pages
- Service listing CRUD
- Availability slot management
- Search and discovery
- Booking draft and pending payment flow

Backend work:

- `users`, `sessions`, `devices`
- `creator_profiles`, `creator_verifications`
- `services`, `service_media`, `availability_slots`
- `bookings`, `booking_events`
- Auth endpoints and listing endpoints
- Slot hold logic with expiration

Web marketplace work:

- Home page
- Search page
- Creator profile page
- Service detail and checkout flow
- Auth screens
- Booking details page

Admin work:

- Creator approval queue
- Basic user and creator lookup
- Audit log viewer baseline

Build steps:

1. Implement auth service with role support for user, creator, and admin.
2. Add email verification and age confirmation flow.
3. Build creator profile editor and service management screens.
4. Add service search, categories, and filtering.
5. Implement availability slots and temporary slot hold behavior.
6. Create booking records with statuses `draft`, `pending_payment`, and `paid_pending_acceptance`.
7. Log booking status changes into `booking_events`.

Exit criteria:

- Buyer can discover a creator and start a booking
- Creator can publish bookable services
- Admin can review basic account and listing activity

## Phase 2: Payments, Held Funds, and Admin Release

Goal: accept money safely and control release through platform rules.

Deliverables:

- Payment intent creation
- Payment webhook processing
- Held-funds state tracking
- Internal ledger entries
- Manual admin release/refund tools
- Booking/payment reconciliation views

Backend work:

- `payments`, `held_funds`, `ledger_entries`, `refunds`, `payouts`
- Provider abstraction interface
- First provider adapter
- Webhook verification
- Admin release and refund commands

Admin work:

- Payment detail view
- Release/refund action panel
- Ledger timeline per booking

Build steps:

1. Design internal payment provider interface before integrating any PSP.
2. Create payment intent flow tied to booking creation.
3. Persist provider identifiers and webhook event references.
4. Move successful payments into held-funds state.
5. Generate immutable ledger entries for gross amount, platform fee, creator amount, refund, and release operations.
6. Add admin-only release and refund endpoints.
7. Add reconciliation dashboards for failed, pending, released, and refunded payments.

Exit criteria:

- Buyer can pay up front
- Funds are tracked as pending/held
- Admin can manually release or refund with audit visibility

## Phase 3: Chat, Delivery, and Booking Completion

Goal: let users and creators communicate and complete digital services inside the platform.
Goal: let users and creators communicate and complete booked services inside the platform.

Deliverables:

- Threaded messaging
- Attachments via signed upload URLs
- Delivery/completion actions
- Abuse reporting hooks
- Notification triggers for booking milestones
- Booking logistics messaging for remote or in-person fulfillment

Backend work:

- `messages`, `message_attachments`, `reports`, `notifications`
- WebSocket messaging gateway
- Redis pub/sub fanout
- Message persistence and read status

Web work:

- Booking-linked chat UI
- File attachment support
- Completion confirmation flow
- Report/block actions

Build steps:

1. Create booking-scoped chat threads.
2. Add message persistence with delivery/read state.
3. Add attachment upload flow using signed URLs.
4. Add buyer and creator completion actions.
5. Add report and block flows wired to moderation intake.
6. Add booking logistics fields and masked coordination flows for in-person services.
7. Trigger email or push notifications for new messages and booking updates.

Exit criteria:

- Booked users can communicate in app
- Service fulfillment can be acknowledged in platform
- Reports flow into moderation review

## Phase 4: Video Sessions and Time-Based Release Rules

Goal: support scheduled paid sessions and reduce manual operations across remote and in-person bookings.

Deliverables:

- Managed video room creation
- Short-lived session tokens
- Join/leave event tracking
- Auto-release timers
- Reminder notifications

Backend work:

- `video_rooms`, `video_session_events`
- Room lifecycle logic
- Release scheduler jobs
- Reminder jobs

Build steps:

1. Integrate managed video provider behind a service abstraction.
2. Create rooms only for eligible accepted bookings.
3. Issue short-lived participant tokens near session start time.
4. Capture room join/leave metadata.
5. Add scheduling support for fulfillment types such as video, call, chat, custom request, and in-person.
6. Add release scheduling for eligible completed bookings.
7. Add a dispute cutoff before automated release runs.

Exit criteria:

- Accepted remote bookings can launch a secure video room
- Accepted in-person bookings have platform-managed scheduling and fulfillment state
- Auto-release rules run safely for undisputed bookings

## Phase 5: Moderation, Disputes, and Trust Operations

Goal: add the operational controls needed for scale and compliance.

Deliverables:

- Dispute intake and evidence review
- Admin resolution tools
- Moderation queue
- Keyword and media scanning hooks
- Account suspension/block controls
- Immutable admin audit logs

Backend work:

- `disputes`, `moderation_actions`, `audit_logs`
- Risk flag generation
- Manual resolution workflows

Admin work:

- Dispute inbox
- Moderation review screens
- Account restriction controls
- Action history and audit trails

Build steps:

1. Add dispute creation before release deadlines.
2. Freeze release when a dispute is opened.
3. Add evidence submission fields and admin notes.
4. Support full release, partial release, and full refund outcomes.
5. Add prohibited listing review and keyword flagging.
6. Log every admin action with actor, timestamp, and target resource.

Exit criteria:

- Admins can review and resolve disputes
- Moderation actions are traceable and reversible where appropriate

## Phase 6: Android App

Goal: bring the marketplace, bookings, messaging, and sessions to Android.

Recommended modules:

- `app`
- `core-ui`
- `core-network`
- `core-database`
- `feature-auth`
- `feature-home`
- `feature-search`
- `feature-profile`
- `feature-booking`
- `feature-chat`
- `feature-video`
- `feature-fulfillment`
- `feature-wallet`
- `feature-notifications`
- `feature-settings`
- `feature-reports`

Build steps:

1. Set up Android design system and navigation shell.
2. Implement auth and age-gate flows.
3. Build discovery, profile, and booking flows.
4. Add chat and booking detail screens.
5. Add fulfillment-specific experiences for video sessions and in-person bookings.
6. Add notifications, reports, and account settings.

Exit criteria:

- Android app supports core marketplace and booking use cases
- Release-ready moderation and reporting controls exist in mobile UX

## Phase 7: Scale, Analytics, and Multi-Provider Expansion

Goal: harden the platform for growth and provider flexibility.

Deliverables:

- Analytics dashboards
- Provider abstraction expansion
- Payout batching
- Improved search relevance
- Performance and caching improvements
- Retention and privacy tooling

Build steps:

1. Track booking conversion, dispute rate, refund rate, response time, and repeat bookings.
2. Add payout batching and payout status visibility.
3. Add second payment provider support behind the existing abstraction.
4. Improve moderation automation with risk scoring and queue prioritization.
5. Add retention controls for messages and files.

Exit criteria:

- Core KPIs are visible
- Payment architecture is not locked to one processor
- Operations scale beyond manual-only workflows

## Cross-Cutting Technical Work

These should start early and evolve every phase:

- JWT access token and refresh rotation
- MFA for creators and admins
- Signed upload URLs
- Row-level authorization
- Rate limiting
- Webhook signature verification
- Secrets management
- Encryption in transit
- Privacy-safe display and messaging rules
- Observability: logs, metrics, tracing, alerting
- Backups and disaster recovery

## Compliance Workstream

This is not optional and should run in parallel with engineering:

- Terms of service
- Privacy policy
- Acceptable use policy
- Creator agreement
- Refund and dispute policy
- Recording consent policy
- Minimum age enforcement rules
- Moderation review SOPs
- Prohibited listings engine specification

Product positioning notes:

- Keep Android and public web positioning centered on creator marketplace and legal digital services
- Avoid explicit sexualized taxonomy, labels, or marketing copy
- Keep any in-person workflow generic and logistics-oriented, not suggestive in copy or category design
- Ensure moderation and listing review are active before broad creator onboarding

## In-Person Trust and Safety Spec

In-person bookings are supported, but the workflow must be controlled, neutral in language, and heavily moderated.

### Location Sharing Rules

- Do not expose exact creator or buyer location publicly on profile or listing pages.
- Store only coarse public location fields such as country, state, metro area, or service region.
- Share exact meeting details only after booking is paid and accepted.
- Reveal exact location on a need-to-know basis inside the booking thread, not in listing metadata.
- Support controlled meeting formats such as creator-provided location, buyer-provided location, or mutually agreed venue.
- Log every reveal or update of sensitive meeting details in booking events or audit logs.

### Contact and Identity Protection

- Keep personal phone numbers and personal email addresses masked by default.
- Use in-app chat as the primary coordination channel.
- If temporary contact relay is ever needed, use masked aliases or expiring relay methods rather than direct disclosure.
- Prevent listing descriptions from including phone numbers, emails, usernames, external payment handles, or off-platform contact bait.
- Add automated detection for attempts to move payment or negotiation off platform.

### Booking Logistics Model

Add in-person logistics fields to the booking domain:

- `fulfillment_type`
- `meeting_mode`
- `location_visibility_status`
- `meeting_window_start`
- `meeting_window_end`
- `check_in_status_buyer`
- `check_in_status_creator`
- `completion_evidence_status`
- `safety_flag_status`

Recommended fulfillment values:

- `video`
- `audio_call`
- `chat`
- `custom_request`
- `in_person`

Recommended meeting mode values for in-person bookings:

- `creator_location`
- `buyer_location`
- `mutual_venue`
- `to_be_confirmed`

### Check-In and Completion Evidence

- Support optional pre-session check-in for both buyer and creator.
- Allow lightweight check-in signals such as "arrived", timestamp confirmation, or one-time booking code verification.
- Keep evidence collection minimal and privacy-aware.
- Do not require precise background GPS tracking.
- Allow admins to review non-public evidence such as chat confirmations, check-in timestamps, attachment evidence, or room/session logs.
- Store evidence references and decision notes in immutable audit trails.

Recommended acceptable completion evidence:

- Buyer confirmation
- Creator confirmation
- Matched check-in records
- Session attendance logs
- Delivery artifact attached to booking
- Admin-reviewed message history

### Disputes for In-Person Services

- In-person disputes should freeze release the same way remote disputes do.
- Provide structured dispute reasons such as no-show, late arrival, service mismatch, safety concern, or incomplete fulfillment.
- Allow both sides to submit text evidence and limited attachments.
- Give admins a timeline view combining booking state, chat, check-in events, payment state, and moderation history.
- Support full release, partial release, refund, or account action outcomes.

### Moderation and Prohibited Listing Patterns

Listings should be rejected or flagged when they:

- Explicitly advertise sexual acts or explicit gratification
- Use escorting, prostitution, or solicitation language
- Promise off-platform payment discounts
- Ask users to move to private contact channels before booking
- Include hidden code words already identified by moderation policy
- Offer unsafe or unlawful in-person arrangements
- Attempt to bypass age-gate, ID, payment, or moderation systems

Moderation tooling should include:

- Keyword and phrase scanning on titles, descriptions, and chat
- Media review hooks for uploaded images or files
- Repeat-offender tracking for users and creators
- Fast suspend and listing takedown actions
- Escalation queue for safety-sensitive in-person disputes

### Operational Safety Controls

- Add manual review for newly created in-person listings before they are publicly visible.
- Require stronger verification for creators offering in-person fulfillment.
- Rate limit edits to in-person location details close to the booking start time.
- Notify both parties when meeting details are changed after acceptance.
- Add a panic/report shortcut inside active booking detail screens.
- Track no-show rates, safety reports, refund rates, and repeat complaints for in-person services separately from remote services.

### Admin Requirements

Admin tools should support:

- Viewing masked and unmasked booking logistics based on permission level
- Reviewing location-detail change history
- Reviewing check-in and evidence timeline
- Freezing payout release on trust or safety flags
- Suspending listings or accounts tied to risky in-person behavior

### Build Requirement

No public launch of in-person bookings should happen until:

- Masked coordination is working
- Manual review for in-person listings is enabled
- Dispute intake and admin resolution flows are live
- Audit logs cover booking logistics and release decisions
- Prohibited listing detection is active
- Stronger creator verification for in-person offerings is implemented

## Suggested Initial Backlog

Week 1:

- Create monorepo structure
- Scaffold backend, marketplace, admin, and Android projects
- Add Docker Compose, PostgreSQL, Redis, and CI
- Write architecture and policy docs

Week 2:

- Implement auth, roles, sessions, and age gate
- Create database schema for users, creators, services, slots, and bookings
- Build marketplace shell and admin shell

Week 3:

- Build creator profile and service CRUD
- Build search/discovery and service detail pages
- Implement slot hold and booking draft flow

Week 4:

- Add payment abstraction and first payment intent flow
- Add held-funds ledger tables and webhook processing
- Add manual admin release/refund tooling

Week 5:

- Add booking chat and attachments
- Add notifications and report flow
- Tighten audit logging and moderation intake
- Add masked in-person coordination model and prohibited listing detection baseline

Week 6:

- Integrate managed video provider
- Add auto-release scheduler
- Add dispute flow and admin resolution tooling
- Add in-person check-in, evidence review, and safety escalation tooling

## Definition of MVP

The MVP is complete when:

- Users can register, verify age, browse creators, and book a service
- Creators can create profiles, publish services, accept bookings, and fulfill through chat, scheduled session, custom delivery, or in-person booking
- Buyers can pay up front and funds remain held pending release/refund
- Admins can review creators, moderate listings, release/refund funds, and resolve disputes manually
- Core trust and compliance controls exist across auth, listings, payments, communications, and audit logs

## Immediate Next Build Order

1. Scaffold repo structure and local development tooling
2. Stand up FastAPI, Next.js marketplace, and Next.js admin shells
3. Design PostgreSQL schema for auth, creators, services, bookings, and payments
4. Implement auth and age gate
5. Implement creator listings and service discovery
6. Implement booking creation and slot holds
7. Implement payment abstraction and held-funds ledger
8. Add admin release/refund tools
9. Add chat and notifications
10. Add video sessions, disputes, and automation

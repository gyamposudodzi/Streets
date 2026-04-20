# Streets UI/UX Roadmap

Last updated: 2026-04-20

## Design Intent

Streets should feel like a premium, trust-heavy creator booking platform. The interface needs to make high-stakes workflows feel simple: users pay upfront, creators decide whether to participate, funds are held, delivery happens, and admin operations handle releases, refunds, disputes, and compliance.

The UI should not feel like a developer scaffold, a generic dashboard, or a casual social app. It should feel structured, confident, and operationally safe.

## Brand Direction

Primary brand colors:

- Grape red: `#7A1632`
- Deep grape: `#4B0D20`
- Black: `#050505`
- Soft black: `#121111`
- Warm off-white: `#F7F1EC`
- Muted surface: `#1A1718`
- Border on dark: `#31272B`
- Success: `#2F8F5B`
- Warning: `#C78A25`
- Danger: `#B3263A`

Recommended color usage:

- Use black as the main structural color for navigation, dashboard shells, and premium surfaces.
- Use grape red as the primary action color, brand highlight, active state, and visual thread through the product.
- Use deep grape for gradients, cards, shadows, and elevated brand moments.
- Use off-white only for content-heavy surfaces where readability matters.
- Avoid bright red error overload. Reserve danger red for actual destructive or risk states.

Brand personality:

- Premium, discreet, controlled, modern.
- Operationally trustworthy, not playful or overly casual.
- Strong enough for payments and disputes, but smooth enough for creator marketplace discovery.

Visual language:

- Rounded but not bubbly.
- Dark-first admin and creator surfaces.
- Marketplace can use a warmer editorial surface but should still retain black/grape accents.
- Use strong section hierarchy, compact status pills, clear timelines, and money-state cards.

Typography direction:

- Use a professional display font for headings, such as `Sora`, `Cabinet Grotesk`, or `General Sans`.
- Use a readable UI font for forms/data, such as `Inter Tight`, `Geist`, or `Source Sans 3`.
- Avoid default `Segoe UI` as the long-term brand font.

## Core UX Principles

1. Status should always explain the next action.

Every booking status needs a human-readable label and next-step copy. Users should never see only `paid_pending_acceptance` or `awaiting_release`.

2. Money state must be visually separate from booking state.

Booking status says what is happening operationally. Payment state says where the money is. These should be connected, but not mixed together.

3. Creator consent is explicit.

The creator must have a clear Accept or Decline moment after buyer payment. Decline should communicate that the buyer is refunded.

4. Admin decisions must feel auditable.

Admin views should show who acted, what changed, when it happened, and what money/listing/dispute object was affected.

5. Public marketplace should hide internal compliance language.

Public users should see polished service discovery. Internal states such as rule matches, compliance notes, provider events, and audit logs belong in creator/admin surfaces.

6. In-person workflows must be neutral and logistics-oriented.

Use language like scheduling, check-in, location details, safety report, booking code, and completion evidence. Avoid suggestive categories or wording.

## Product Navigation Model

Marketplace navigation:

- Home
- Explore
- Creator profile
- Service detail
- Checkout
- Booking detail
- Messages
- Account

Creator navigation:

- Overview
- Profile
- Services
- Availability
- Booking requests
- Active bookings
- Earnings pending
- Reports/support
- Settings

Admin navigation:

- Command center
- Service review
- Bookings
- Payments
- Disputes
- Reports
- Users
- Creators
- Public wording rules
- Audit logs
- Settings

## User Journey Architecture

### Buyer Journey

Goal: browse, book, pay, wait for creator decision, receive service, confirm or dispute.

Primary screens:

- Marketplace home.
- Search/explore.
- Service detail.
- Checkout.
- Booking detail.
- Booking chat.
- Dispute form.

Ideal flow:

1. Buyer discovers a service.
2. Buyer opens service detail.
3. Buyer reviews fulfillment type, duration, price, and creator profile.
4. Buyer books and pays upfront.
5. Booking page shows `Waiting for creator decision`.
6. If creator accepts, booking moves to accepted/in progress.
7. If creator declines, buyer sees refunded state.
8. Buyer uses chat for booking-scoped coordination.
9. Buyer confirms completion or opens dispute.
10. Buyer sees release/refund outcome.

UX requirements:

- Checkout must clearly say payment is upfront and funds are held pending creator decision/release rules.
- Buyer must see that creator can decline.
- Decline state must reassure buyer that funds were refunded.
- Booking detail must show a timeline, not only status text.
- Dispute should be easy to find before release.

### Creator Journey

Goal: publish services, manage availability, choose bookings, deliver work, track pending funds.

Primary screens:

- Creator onboarding/profile.
- Service manager.
- Availability manager.
- Booking request inbox.
- Booking detail.
- Earnings/pending funds.

Ideal flow:

1. Creator creates profile.
2. Creator creates service.
3. Clean service auto-approves.
4. Held wording goes to admin review.
5. Buyer books and pays.
6. Creator sees booking request.
7. Creator accepts or declines.
8. Accepted booking moves to active delivery.
9. Creator marks in progress and delivered.
10. Creator waits for release or dispute outcome.

UX requirements:

- Creator dashboard must prioritize booking requests.
- Accept and Decline must be visually distinct.
- Decline copy should explain buyer refund.
- Service status should say `Public`, `Held for review`, or `Rejected`, not raw moderation codes.
- Creator should see pending funds separately from released earnings.

### Admin Journey

Goal: operate trust, money, disputes, compliance, and account safety.

Primary screens:

- Command center.
- Payment queue.
- Dispute center.
- Service review.
- Public wording rules.
- Audit logs.
- User/creator lookup.

Ideal flow:

1. Admin sees operational counts.
2. Admin reviews held services and rule matches.
3. Admin monitors bookings and payment states.
4. Admin releases/refunds funds.
5. Admin resolves disputes.
6. Admin reviews reports.
7. Admin audits past decisions.
8. Admin adjusts public wording rules.

UX requirements:

- Admin should never hunt through raw IDs without summaries.
- Every money action needs a confirmation step before production.
- Audit logs should be filterable by actor, action, target, and date.
- Dispute center needs combined booking timeline, chat summary, payment state, evidence, and decision panel.
- Public wording rules need clear `hold` versus `flag` behavior.

## Information Architecture

### Marketplace Home

Purpose:

- Communicate premium creator marketplace.
- Drive users to explore approved services.
- Avoid internal policy language.

Sections:

- Hero with brand statement and primary CTA.
- Featured categories.
- Featured creators.
- Popular services.
- How booking works.
- Trust and payment-hold explanation.

Key copy direction:

- “Book creator sessions with upfront payment and platform-managed release.”
- “Creators choose the bookings they accept.”
- “Funds stay pending until delivery, release, or refund.”

### Search / Explore

Purpose:

- Find services quickly.

Filters:

- Query.
- Fulfillment type.
- Category.
- Price range.
- Duration.
- Availability.

Cards should show:

- Service title.
- Creator name.
- Fulfillment type.
- Duration.
- Price.
- Rating/review summary later.
- CTA: View service.

Do not show:

- Moderation status.
- Compliance score.
- Provider/payment internals.

### Service Detail

Purpose:

- Let buyer understand offer and start booking.

Sections:

- Service hero.
- Creator summary.
- Price and duration.
- Fulfillment type.
- Availability.
- What happens after booking.
- Safety/trust note.
- CTA: Book service.

Important UI copy:

- “You pay upfront. The creator accepts or declines. If declined, you are refunded.”

### Checkout / Booking Creation

Purpose:

- Confirm booking intent and payment expectations.

Sections:

- Service summary.
- Selected slot or flexible schedule.
- Price breakdown.
- Buyer acknowledgement.
- Continue to payment.

Payment explainer:

- Gross price.
- Platform fee if shown.
- Creator amount if appropriate.
- Held funds explanation.

### Booking Detail

Purpose:

- The central workflow page for buyer/creator/admin-facing booking state.

Sections:

- Human-readable current status.
- Next action panel.
- Four-step flow.
- Payment/held funds panel.
- Delivery controls.
- Chat.
- Dispute/report controls.
- Event timeline.

Status labels:

- `pending_payment`: Awaiting buyer payment.
- `paid_pending_acceptance`: Waiting for creator decision.
- `accepted`: Accepted by creator.
- `in_progress`: In progress.
- `awaiting_release`: Delivered, awaiting release window.
- `delivered`: Buyer confirmed completion.
- `disputed`: In dispute review.
- `declined`: Declined by creator.
- `released`: Funds released.
- `refunded`: Buyer refunded.

### Creator Dashboard

Purpose:

- Give creators control over profile, services, requests, delivery, and funds.

Recommended layout:

- Left sidebar.
- Top summary cards.
- Main request queue.
- Secondary panels for services/availability.

Priority order:

1. Booking requests needing decision.
2. Active bookings.
3. Pending funds.
4. Service visibility issues.
5. Availability.

Booking request card:

- Buyer display alias.
- Service title.
- Price.
- Fulfillment type.
- Requested time.
- Status.
- Accept.
- Decline.

### Admin Dashboard

Purpose:

- Operational command center.

Recommended layout:

- Black shell.
- Grape red active nav.
- Dense cards and queues.
- Split-panel detail views.

Top cards:

- Held funds.
- Bookings waiting creator decision.
- Open disputes.
- Reports.
- Held listings.
- Refund/release queue.

Primary queues:

- Payment actions.
- Disputes.
- Held services.
- Reports.
- Recent audit events.

Admin action patterns:

- Release funds: primary action, requires confirmation.
- Refund buyer: secondary/destructive action, requires reason.
- Reject listing: destructive action, requires reason.
- Disable rule: neutral action.

## Design System Roadmap

### Tokens

Create shared CSS variables:

```css
:root {
  --color-grape-red: #7a1632;
  --color-deep-grape: #4b0d20;
  --color-black: #050505;
  --color-soft-black: #121111;
  --color-off-white: #f7f1ec;
  --color-surface-dark: #1a1718;
  --color-border-dark: #31272b;
  --color-success: #2f8f5b;
  --color-warning: #c78a25;
  --color-danger: #b3263a;
}
```

Core tokens:

- Color.
- Type scale.
- Spacing scale.
- Radius scale.
- Shadow/elevation.
- Status colors.
- Motion timings.

### Components

Foundation components:

- App shell.
- Sidebar.
- Top bar.
- Page header.
- Card.
- Stat card.
- Status pill.
- Money state card.
- Timeline.
- Stepper.
- Data table.
- Empty state.
- Alert.
- Modal.
- Confirm dialog.
- Form field.
- Select.
- Textarea.
- Button.
- Tabs.
- Drawer.

Workflow components:

- Booking status panel.
- Creator decision card.
- Payment hold panel.
- Release/refund decision panel.
- Dispute case panel.
- Service compliance card.
- Audit log row.
- Public wording rule editor.

### Status Pill System

Booking statuses:

- Waiting: amber.
- Accepted/in progress: grape red.
- Delivered/awaiting release: blue-neutral or grape outline.
- Released: green.
- Refunded/declined: neutral.
- Disputed: danger.

Payment statuses:

- Requires action: amber.
- Succeeded/held: grape.
- Released: green.
- Refunded: neutral/danger depending context.

Service statuses:

- Public: green.
- Held for review: amber.
- Rejected: danger.

## Page Redesign Phases

### UX Phase 1: Brand Foundation

Goal:

- Replace scaffold look with grape red/black professional visual system.

Deliverables:

- CSS variables.
- Typography update.
- Button/status/card redesign.
- Marketplace and admin shell redesign.
- Shared status label helpers.

Acceptance criteria:

- No raw enum/status labels in user-facing screens.
- Public marketplace no longer exposes internal moderation/payment wording.
- Brand colors are consistently applied.

### UX Phase 2: Marketplace Conversion Flow

Goal:

- Make buyer discovery and booking flow polished.

Deliverables:

- Home redesign.
- Explore/search redesign.
- Service detail redesign.
- Checkout redesign.
- Booking detail flow stepper.

Acceptance criteria:

- Buyer understands creator can accept/decline.
- Buyer understands funds are held.
- Booking CTA path is obvious on desktop and mobile.

### UX Phase 3: Creator Operations

Goal:

- Make creators feel in control.

Deliverables:

- Creator dashboard shell.
- Booking request inbox.
- Active booking board.
- Service manager.
- Availability manager.
- Pending funds overview.

Acceptance criteria:

- Creator sees pending booking decisions first.
- Accept/Decline actions are prominent.
- Service visibility issues are understandable.

### UX Phase 4: Admin Command Center

Goal:

- Make admin tools operationally useful.

Deliverables:

- Admin sidebar shell.
- Queue-based dashboard.
- Payment action queue.
- Dispute case view.
- Held listing review view.
- Audit log filters.
- Public wording rules editor.

Acceptance criteria:

- Admin can find money-risk actions quickly.
- Every release/refund/reject action has visible context.
- Audit history is easy to inspect.

### UX Phase 5: Trust, Safety, and In-Person Logistics

Goal:

- Add safe, neutral, controlled logistics UX.

Deliverables:

- Masked location coordination UI.
- Check-in status UI.
- Safety/report shortcut.
- Completion evidence UI.
- In-person dispute reason set.

Acceptance criteria:

- No exact public location exposure.
- Booking details reveal logistics only after paid and accepted.
- Dispute flow captures enough context for admin review.

### UX Phase 6: Mobile and Android Alignment

Goal:

- Bring the same workflow clarity to mobile and Android.

Deliverables:

- Mobile web responsive polish.
- Android navigation architecture.
- Android screen parity map.
- Shared copy/status taxonomy.

Acceptance criteria:

- Buyer, creator, and admin-critical workflows are usable on mobile.
- Android can reuse the same state language and journey structure.

## Screen Priority List

Highest priority:

1. Booking detail.
2. Creator booking requests.
3. Payment/held funds panel.
4. Admin payment/dispute queues.
5. Service detail and checkout.

Medium priority:

1. Marketplace home.
2. Search/explore.
3. Creator service manager.
4. Admin service review.
5. Audit logs.

Later:

1. Public creator profile polish.
2. Analytics.
3. Settings.
4. Notification center.
5. Android-specific screens.

## UX Gaps in Current App

Current issues:

- Marketplace visuals still use the old warm scaffold palette.
- Admin dashboard is a long stacked page instead of a command center.
- Creator dashboard combines too many jobs on one page.
- Booking IDs are too prominent compared with user-facing status.
- Payment provider events are visible in user surfaces; these should eventually move to admin/advanced details.
- There is no dedicated checkout review page yet.
- No confirmation dialogs for release/refund/reject actions.
- No mobile-specific interaction polish.

Immediate UI cleanup:

- Replace warm brown theme with grape red and black brand system.
- Convert raw statuses to status pills everywhere.
- Move technical provider events out of default buyer view.
- Make creator booking requests a top panel.
- Split admin dashboard into queue sections.
- Add confirmation modals for money actions.

## Copy Guidelines

Use:

- “Creator booking.”
- “Booking request.”
- “Creator decision.”
- “Held funds.”
- “Release funds.”
- “Refund buyer.”
- “Public wording review.”
- “Service delivery.”
- “In-person booking logistics.”

Avoid:

- “Escrow” unless legally approved.
- Explicit sexual-service wording in public UI.
- “Escort,” “prostitution,” or suggestive categories in user-facing marketing.
- Raw enum labels in UI.
- Overly playful money/dispute copy.

## Success Metrics

Buyer UX:

- Booking conversion rate.
- Checkout completion rate.
- Buyer dispute rate.
- Buyer refund understanding from support tickets.

Creator UX:

- Creator response time.
- Acceptance/decline rate.
- Service creation completion.
- Booking delivery completion rate.

Admin UX:

- Time to resolve dispute.
- Time to release/refund.
- Number of unresolved held listings.
- Audit lookup success.

Marketplace UX:

- Search to service-detail clickthrough.
- Service-detail to booking-start conversion.
- Repeat booking rate.

## Next Design Implementation Order

1. Create brand tokens and replace the current warm scaffold palette.
2. Redesign marketplace booking detail as the source-of-truth workflow page.
3. Redesign creator dashboard around booking requests first.
4. Redesign admin dashboard into an operations command center.
5. Redesign service detail and checkout.
6. Add status pill and timeline components.
7. Add confirmation dialogs for release/refund/reject/decline.
8. Add mobile responsive polish.

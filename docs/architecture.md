# Streets Architecture

## Platform Surfaces

- Web marketplace
- Admin dashboard
- Android app
- FastAPI backend
- Background workers

## Core Domains

- Auth and identity
- Creator profiles and services
- Booking lifecycle
- Payments and held funds
- Chat and attachments
- Video and session fulfillment
- Moderation and trust
- Notifications
- Admin operations

## Service Shape

```text
Clients
  -> API layer
  -> Domain services
  -> Persistence and external providers
```

Initial backend modules should evolve toward:

- `api`
- `core`
- `db`
- `models`
- `schemas`
- `services`
- `tasks`

## Repo Intent

- `apps/marketplace`: public user-facing web app
- `apps/admin`: internal moderation and operations dashboard
- `apps/android`: Android client with modular feature growth path
- `backend/app`: API service
- `backend/workers`: async jobs and event handlers
- `packages/*`: shared frontend code and types
- `infra/docker`: local development orchestration

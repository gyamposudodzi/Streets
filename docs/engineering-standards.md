# Engineering Standards

## General

- Prefer clear bounded domains over tightly coupled feature code.
- Keep payment provider logic behind internal interfaces.
- Treat moderation, auditability, and safety controls as core product features.
- Use neutral creator-marketplace wording across code, docs, seeds, and UI.

## Backend

- FastAPI for APIs
- SQLite for development speed during early phases
- PostgreSQL remains the intended production source of truth
- Redis for ephemeral coordination and messaging fanout
- Background jobs for timers, webhook processing, notifications, and release workflows

## Frontend

- Next.js + React + TypeScript for marketplace and admin
- Shared types and client helpers in `packages`
- Keep admin and marketplace visually and operationally separate

## Android

- Kotlin + Jetpack Compose
- MVVM + repository pattern
- Feature-oriented modules as the app grows

## Quality

- Add linting and formatting before expanding feature code
- Prefer small PRs that move one bounded part of the platform forward
- Require audit-sensitive changes to include tests or explicit verification notes

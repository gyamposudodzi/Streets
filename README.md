# Streets

Streets is an age-gated creator booking platform for legal creator services across web, Android, and admin surfaces.

## Phase 0 Status

This repository now includes the initial foundation scaffold for:

- `apps/marketplace` for the web marketplace
- `apps/admin` for the admin dashboard
- `apps/android` for the Android app skeleton
- `backend` for FastAPI APIs and background worker placeholders
- `packages` for shared types, UI, API client, and utilities
- `infra` for local infrastructure config
- `docs` for architecture, standards, and product guardrails

## Repository Layout

```text
apps/
  admin/
  android/
  marketplace/
backend/
  app/
  workers/
docs/
infra/
  docker/
packages/
  api-client/
  types/
  ui/
  utils/
```

## Getting Started

Phase 0 focuses on structure and standards, not a fully installed runtime yet.

Local backend development now defaults to SQLite at `backend/data/streets_dev.db` so we can work without requiring PostgreSQL during early feature delivery.

### Run API + web apps from the repo root

After `npm install` at the root and a Python environment with `pip install -r backend/requirements.txt` (a `.venv` in the repo root is detected automatically; otherwise set `STREETS_PYTHON` to your interpreter):

```bash
npm run dev
```

This starts the FastAPI app on **http://127.0.0.1:8000**, the marketplace on **http://127.0.0.1:3000**, and the admin app on **http://127.0.0.1:3001**. Use `npm run dev:api`, `npm run dev:marketplace`, or `npm run dev:admin` to run a single service. Root `npm run build` builds both Next apps.

Suggested next steps:

1. Install dependencies for the selected package managers and toolchains.
2. Expand the FastAPI app into versioned modules and grow the SQLite-backed development data layer.
3. Replace placeholder Next.js pages with real app bootstrap code.
4. Generate the Android Gradle wrapper and complete the Compose app bootstrap.
5. Wire CI to real lint, test, and build commands once dependencies are installed.

## Key Docs

- [Roadmap](./roadmap.md)
- [Project Details](./project-details.md)
- [UI/UX Roadmap](./docs/ui-ux-roadmap.md)
- [Architecture](./docs/architecture.md)
- [Engineering Standards](./docs/engineering-standards.md)
- [Product Guardrails](./docs/product-guardrails.md)

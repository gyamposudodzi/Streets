import { existsSync } from "node:fs";

const requiredPaths = [
  "apps/marketplace/package.json",
  "apps/admin/package.json",
  "apps/android/settings.gradle.kts",
  "backend/app/main.py",
  "backend/db/schema.sql",
  "backend/db/schema.sqlite.sql",
  "backend/workers/__init__.py",
  "infra/docker/docker-compose.yml",
  "docs/architecture.md",
  "docs/engineering-standards.md",
  "docs/product-guardrails.md"
];

const missing = requiredPaths.filter((target) => !existsSync(target));

if (missing.length > 0) {
  console.error("Missing required scaffold paths:");
  for (const entry of missing) {
    console.error(`- ${entry}`);
  }
  process.exit(1);
}

console.log("Phase 0 scaffold structure looks good.");

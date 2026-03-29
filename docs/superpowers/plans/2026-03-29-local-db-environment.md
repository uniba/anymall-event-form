# Local DB Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate remote DB dependency for local development and testing by providing Docker Compose for dev and Testcontainers for automated tests.

**Architecture:** Docker Compose runs a persistent PostgreSQL 16 container for local development. Testcontainers spins up ephemeral PostgreSQL containers for vitest (unit/integration) and Playwright (E2E) independently — no manual DB setup needed for test runs.

**Tech Stack:** Docker Compose, PostgreSQL 16, Testcontainers (`@testcontainers/postgresql`), Prisma, vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-03-29-local-db-environment-design.md`

---

### Task 1: Docker Compose for Development DB

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.development`
- Modify: `.env.example`

- [ ] **Step 1: Create `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: anymall
      POSTGRES_PASSWORD: anymall
      POSTGRES_DB: anymall_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U anymall -d anymall_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

- [ ] **Step 2: Create `.env.development`**

This file is committed to git. Next.js loads it automatically during `next dev`.

```
DATABASE_URL=postgresql://anymall:anymall@localhost:5432/anymall_dev
DATABASE_URL_UNPOOLED=postgresql://anymall:anymall@localhost:5432/anymall_dev
SENDGRID_API_KEY=placeholder
EMAIL_FROM=dev@localhost
ADMIN_PIN=0000
```

- [ ] **Step 3: Update `.env.example`**

Replace the current contents of `.env.example` with:

```
# Production (Neon) — set in .env or .env.local (gitignored)
DATABASE_URL=
DATABASE_URL_UNPOOLED=
SENDGRID_API_KEY=
EMAIL_FROM=
APP_URL=
ADMIN_PIN=

# Local development — already configured in .env.development
# DATABASE_URL=postgresql://anymall:anymall@localhost:5432/anymall_dev
# DATABASE_URL_UNPOOLED=postgresql://anymall:anymall@localhost:5432/anymall_dev
```

- [ ] **Step 4: Verify Docker Compose starts**

Run:
```bash
docker compose up -d
```
Expected: Container starts, `docker compose ps` shows `db` service healthy.

Run:
```bash
docker compose exec db psql -U anymall -d anymall_dev -c "SELECT 1"
```
Expected: Returns `1`.

- [ ] **Step 5: Verify Prisma migrate + seed works against local DB**

Run:
```bash
DATABASE_URL=postgresql://anymall:anymall@localhost:5432/anymall_dev \
DATABASE_URL_UNPOOLED=postgresql://anymall:anymall@localhost:5432/anymall_dev \
npx prisma migrate dev
```
Expected: All 16 migrations applied successfully.

Run:
```bash
DATABASE_URL=postgresql://anymall:anymall@localhost:5432/anymall_dev \
DATABASE_URL_UNPOOLED=postgresql://anymall:anymall@localhost:5432/anymall_dev \
npx prisma db seed
```
Expected: `Seeded 2 venues and 12 slots.`

- [ ] **Step 6: Stop Docker Compose**

```bash
docker compose down
```

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.development .env.example
git commit -m "feat: add Docker Compose for local development DB"
```

---

### Task 2: npm Scripts for Developer Workflow

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add DB and setup scripts to `package.json`**

Add these scripts (keep all existing scripts):

```json
"db:up": "docker compose up -d",
"db:down": "docker compose down",
"db:reset": "docker compose down -v && docker compose up -d && npx prisma migrate dev && npx prisma db seed",
"dev:setup": "docker compose up -d && npx prisma migrate dev && npx prisma db seed"
```

The full scripts section should be:

```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && prisma migrate deploy && next build",
  "start": "next start",
  "typecheck": "tsc --noEmit",
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:seed": "prisma db seed",
  "db:up": "docker compose up -d",
  "db:down": "docker compose down",
  "db:reset": "docker compose down -v && docker compose up -d && npx prisma migrate dev && npx prisma db seed",
  "dev:setup": "docker compose up -d && npx prisma migrate dev && npx prisma db seed",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 2: Verify `dev:setup` works end-to-end**

Run:
```bash
npm run db:reset
```
Expected: Volume destroyed, container restarted, migrations applied, seed data inserted.

Run:
```bash
npm run dev
```
Expected: Next.js dev server starts, homepage loads at http://localhost:3000 (uses `.env.development` DB URL automatically).

Stop the dev server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: add db:up, db:down, db:reset, dev:setup scripts"
```

---

### Task 3: Install Testcontainers

**Files:**
- Modify: `package.json` (devDependencies)

- [ ] **Step 1: Install `@testcontainers/postgresql`**

Run:
```bash
npm install -D @testcontainers/postgresql
```

- [ ] **Step 2: Verify installation**

Run:
```bash
node -e "require('@testcontainers/postgresql')"
```
Expected: No error.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @testcontainers/postgresql devDependency"
```

---

### Task 4: Vitest Global Setup with Testcontainers

**Files:**
- Create: `test/global-setup.ts`
- Create: `test/global-teardown.ts`
- Modify: `vitest.config.mts`

- [ ] **Step 1: Create `test/global-setup.ts`**

```typescript
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";

let container: StartedPostgreSqlContainer;

export async function setup() {
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("anymall_test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const databaseUrl = container.getConnectionUri();

  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_URL_UNPOOLED = databaseUrl;

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: databaseUrl, DATABASE_URL_UNPOOLED: databaseUrl },
    stdio: "pipe",
  });

  // Make container accessible to teardown via globalThis
  (globalThis as Record<string, unknown>).__TESTCONTAINER__ = container;
}
```

- [ ] **Step 2: Create `test/global-teardown.ts`**

```typescript
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export async function teardown() {
  const container = (globalThis as Record<string, unknown>).__TESTCONTAINER__ as
    | StartedPostgreSqlContainer
    | undefined;

  if (container) {
    await container.stop();
  }
}
```

- [ ] **Step 3: Update `vitest.config.mts`**

Replace the entire file with:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": __dirname,
    },
  },
  test: {
    globalSetup: ["./test/global-setup.ts"],
  },
});
```

- [ ] **Step 4: Verify Testcontainers starts during test run**

Run:
```bash
npx vitest run lib/referral-tracking.test.ts 2>&1
```
Expected: PostgreSQL container starts (visible in Docker), tests pass, container is destroyed after.

Run:
```bash
docker ps --filter "ancestor=postgres:16-alpine"
```
Expected: No running containers (teardown cleaned up).

- [ ] **Step 5: Verify existing tests still pass**

Run:
```bash
npx vitest run lib/referral-tracking.test.ts app/api/applications/route.test.ts 2>&1
```
Expected: All 28 tests pass. The mocked tests (`route.test.ts`) continue using mocks — the global setup simply makes a real DB available for tests that want it.

- [ ] **Step 6: Commit**

```bash
git add test/global-setup.ts test/global-teardown.ts vitest.config.mts
git commit -m "feat: add Testcontainers global setup for vitest"
```

---

### Task 5: DB Test Helpers

**Files:**
- Create: `test/helpers.ts`

- [ ] **Step 1: Write the failing test for `truncateAll`**

Create `test/helpers.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { truncateAll } from "./helpers";

describe("truncateAll", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  });

  it("removes all rows from all tables", async () => {
    // Insert test data
    const venue = await prisma.venue.create({
      data: { name: "Test Venue", address: "Test Address" },
    });
    await prisma.slot.create({
      data: {
        venueId: venue.id,
        eventName: "Test Event",
        theme: "Test",
        instructor: "Test",
        capacity: 10,
        applicationBegin: new Date(),
        applicationDeadline: new Date(),
        lotteryResultTime: new Date(),
        startsAt: new Date(),
        endsAt: new Date(),
        state: "ACCEPTING_APPLICATIONS",
      },
    });

    // Truncate
    await truncateAll(prisma);

    // Verify empty
    const venues = await prisma.venue.findMany();
    const slots = await prisma.slot.findMany();
    const submissions = await prisma.submission.findMany();

    expect(venues).toHaveLength(0);
    expect(slots).toHaveLength(0);
    expect(submissions).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npx vitest run test/helpers.test.ts 2>&1
```
Expected: FAIL — `truncateAll` does not exist yet.

- [ ] **Step 3: Create `test/helpers.ts`**

```typescript
import type { PrismaClient } from "@prisma/client";

const TABLES = [
  "SubmissionSlot",
  "Submission",
  "Slot",
  "Venue",
] as const;

export async function truncateAll(prisma: PrismaClient): Promise<void> {
  for (const table of TABLES) {
    await (prisma[table as Uncapitalize<typeof table>] as any).deleteMany();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```bash
npx vitest run test/helpers.test.ts 2>&1
```
Expected: PASS — 1 test passes.

- [ ] **Step 5: Verify all tests still pass**

Run:
```bash
npx vitest run 2>&1 | tail -10
```
Expected: `test/helpers.test.ts` passes, `lib/referral-tracking.test.ts` passes, `app/api/applications/route.test.ts` passes. (Ignore `lib/mailer.test.ts` failures — pre-existing issue unrelated to this work.)

- [ ] **Step 6: Commit**

```bash
git add test/helpers.ts test/helpers.test.ts
git commit -m "feat: add truncateAll DB test helper with tests"
```

---

### Task 6: Playwright Global Setup with Testcontainers

**Files:**
- Create: `e2e/global-setup.ts`
- Create: `e2e/global-teardown.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Create `e2e/global-setup.ts`**

```typescript
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const STATE_FILE = path.join(__dirname, ".e2e-state.json");

async function globalSetup() {
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("anymall_e2e")
    .withUsername("test")
    .withPassword("test")
    .start();

  const databaseUrl = container.getConnectionUri();

  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DATABASE_URL_UNPOOLED: databaseUrl,
  };

  // Run migrations
  execSync("npx prisma migrate deploy", { env, stdio: "pipe" });

  // Run seed
  execSync("npx prisma db seed", { env, stdio: "pipe" });

  // Save state for teardown and webServer
  fs.writeFileSync(STATE_FILE, JSON.stringify({
    containerId: container.getId(),
    databaseUrl,
  }));

  // Set env for webServer (Next.js dev server)
  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_URL_UNPOOLED = databaseUrl;
}

export default globalSetup;
```

- [ ] **Step 2: Create `e2e/global-teardown.ts`**

```typescript
import { GenericContainer } from "@testcontainers/postgresql";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const STATE_FILE = path.join(__dirname, ".e2e-state.json");

async function globalTeardown() {
  if (fs.existsSync(STATE_FILE)) {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf-8"));

    // Stop the container by ID
    try {
      execSync(`docker stop ${state.containerId}`, { stdio: "pipe" });
      execSync(`docker rm ${state.containerId}`, { stdio: "pipe" });
    } catch {
      // Container may already be stopped
    }

    fs.unlinkSync(STATE_FILE);
  }
}

export default globalTeardown;
```

- [ ] **Step 3: Add `.e2e-state.json` to `.gitignore`**

Append to `.gitignore`:

```
# Playwright Testcontainers state
e2e/.e2e-state.json
```

- [ ] **Step 4: Update `playwright.config.ts`**

Replace the entire file with:

```typescript
import { defineConfig } from "@playwright/test";
import fs from "fs";
import path from "path";

function getTestDatabaseUrl(): string | undefined {
  const stateFile = path.join(__dirname, "e2e", ".e2e-state.json");
  if (fs.existsSync(stateFile)) {
    const state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    return state.databaseUrl;
  }
  return undefined;
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60000,
    env: {
      DATABASE_URL: getTestDatabaseUrl() ?? "",
      DATABASE_URL_UNPOOLED: getTestDatabaseUrl() ?? "",
      SENDGRID_API_KEY: "placeholder",
      EMAIL_FROM: "test@localhost",
      ADMIN_PIN: "0000",
    },
  },
});
```

- [ ] **Step 5: Verify Playwright setup works**

Run:
```bash
npx playwright test e2e/referral-tracking.spec.ts --reporter=list 2>&1 | head -30
```
Expected: Container starts, migrations run, seed runs, Next.js dev server starts, tests execute against real DB. Tests that rely on page rendering with DB data should now work.

- [ ] **Step 6: Commit**

```bash
git add e2e/global-setup.ts e2e/global-teardown.ts playwright.config.ts .gitignore
git commit -m "feat: add Testcontainers global setup for Playwright E2E"
```

---

### Task 7: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Full unit test run**

Run:
```bash
npx vitest run lib/referral-tracking.test.ts app/api/applications/route.test.ts test/helpers.test.ts 2>&1
```
Expected: All tests pass. Testcontainers starts and stops cleanly.

- [ ] **Step 2: TypeScript check**

Run:
```bash
npx tsc --noEmit 2>&1
```
Expected: No errors.

- [ ] **Step 3: Docker Compose dev workflow**

Run:
```bash
npm run db:reset 2>&1
```
Expected: Container recreated, migrations applied, seed inserted.

- [ ] **Step 4: Playwright E2E test run**

Run:
```bash
npm run test:e2e 2>&1 | tail -20
```
Expected: Testcontainers starts separate container, Next.js dev server starts, E2E tests run.

- [ ] **Step 5: Clean up**

Run:
```bash
npm run db:down
docker ps --filter "ancestor=postgres:16-alpine"
```
Expected: No PostgreSQL containers running.

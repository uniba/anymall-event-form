# Local DB Environment Design

## Goal

Eliminate remote DB dependency for local development and testing. Each developer gets a self-contained, reproducible PostgreSQL environment with a single command.

## Architecture

Two independent DB strategies for two use cases:

1. **Development** — Docker Compose with persistent volume
2. **Testing** — Testcontainers with ephemeral containers (vitest + Playwright)

## 1. Development DB (Docker Compose)

### docker-compose.yml

Single PostgreSQL 16 service:
- Port: 5432
- Credentials: `anymall:anymall`
- Database: `anymall_dev`
- Volume: `pgdata` for persistence across restarts
- Healthcheck: `pg_isready`

### Environment Variable Strategy

Next.js loads `.env.development` automatically during `next dev`. This file is committed to git so all developers share the same local config.

- `.env.development` (committed): Local DB URLs, placeholder SendGrid/admin values
- `.env` (gitignored): Production Neon URLs, real secrets
- `.env.local` (gitignored): Per-developer overrides if needed

`.env.development` contents:
```
DATABASE_URL=postgresql://anymall:anymall@localhost:5432/anymall_dev
DATABASE_URL_UNPOOLED=postgresql://anymall:anymall@localhost:5432/anymall_dev
SENDGRID_API_KEY=placeholder
EMAIL_FROM=dev@localhost
ADMIN_PIN=0000
```

### Developer Workflow

```bash
npm run dev:setup   # docker compose up -d + migrate + seed
npm run dev         # start Next.js dev server
```

Subsequent sessions only need `docker compose up -d` (data persists) and `npm run dev`.

Reset everything: `npm run db:reset` (destroys volume, recreates).

## 2. Test DB (Testcontainers)

### Vitest Integration

Testcontainers programmatically starts a PostgreSQL container before tests and destroys it after.

**File structure:**
```
test/
  global-setup.ts      — Start container, run migrations, export DATABASE_URL
  global-teardown.ts   — Stop and remove container
  helpers.ts           — truncateAll() for inter-test cleanup
```

**global-setup.ts flow:**
1. Start `PostgreSqlContainer` (random port, no conflicts)
2. Set `DATABASE_URL` environment variable to container's connection string
3. Run `prisma migrate deploy` via exec
4. Store container reference for teardown

**Test isolation:**
- Each test file calls `truncateAll()` in `beforeEach` to reset data
- No test pollution across files
- DB-independent tests (e.g., `referral-tracking.test.ts` with happy-dom) are unaffected — Testcontainers only adds ~3-5s startup overhead to DB-dependent test files

**vitest.config.mts changes:**
- Add `globalSetup: ['./test/global-setup.ts']` for DB-dependent test projects
- Use vitest `projects` or `workspace` to separate DB vs non-DB tests if startup cost matters

### Playwright Integration

Separate Testcontainers instance for E2E tests (independent of vitest).

**File structure:**
```
e2e/
  global-setup.ts      — Start container, migrate, seed, export URL
  global-teardown.ts   — Stop container
```

**e2e/global-setup.ts flow:**
1. Start `PostgreSqlContainer`
2. Run `prisma migrate deploy`
3. Run `prisma db seed` (E2E needs realistic data)
4. Set `DATABASE_URL` for the Next.js dev server
5. Return container reference

**playwright.config.ts changes:**
- `globalSetup: './e2e/global-setup.ts'`
- `globalTeardown: './e2e/global-teardown.ts'`
- `webServer.env` receives the dynamic DATABASE_URL

## 3. npm Scripts

```json
{
  "db:up": "docker compose up -d",
  "db:down": "docker compose down",
  "db:reset": "docker compose down -v && docker compose up -d && npx prisma migrate dev && npx prisma db seed",
  "dev:setup": "docker compose up -d && npx prisma migrate dev && npx prisma db seed",
  "test": "vitest run",
  "test:e2e": "playwright test"
}
```

- `test` and `test:e2e` require no manual DB setup — Testcontainers handles everything
- `dev:setup` is the one-command onboarding experience

## 4. New Developer Onboarding

```bash
git clone <repo>
npm install
npm run dev:setup   # Docker + migrate + seed (~30 seconds)
npm run dev         # Development server ready
```

Prerequisites: Node.js, Docker Desktop.

## 5. Dependencies Added

```json
{
  "devDependencies": {
    "@testcontainers/postgresql": "^10.x"
  }
}
```

## 6. Files Changed/Created

| File | Action | Purpose |
|------|--------|---------|
| `docker-compose.yml` | Create | Dev PostgreSQL service |
| `.env.development` | Create | Local DB config (committed) |
| `.env.example` | Update | Add local DB URL examples |
| `test/global-setup.ts` | Create | Testcontainers for vitest |
| `test/global-teardown.ts` | Create | Container cleanup for vitest |
| `test/helpers.ts` | Create | DB truncation utility |
| `e2e/global-setup.ts` | Create | Testcontainers for Playwright |
| `e2e/global-teardown.ts` | Create | Container cleanup for Playwright |
| `vitest.config.mts` | Update | Add globalSetup |
| `playwright.config.ts` | Update | Add globalSetup/teardown, env passthrough |
| `package.json` | Update | Add scripts, devDependency |

## 7. What This Does NOT Change

- Production deployment (Vercel + Neon) — untouched
- `.env` file (gitignored) — still holds production secrets
- Prisma schema — no changes needed
- Existing test files — continue working as-is, gain real DB option

# Anymall Lunch Event Form

Simple Next.js app for collecting lunch event applications and sending confirmation emails.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma
- Neon Postgres
- SendGrid

## What It Does

- Shows the application form on the home page
- Collects `name`, `email`, `birthday`, `gender`, and slot selections
- Validates input on both client and server
- Saves application and slot application data in Postgres
- Sends a confirmation email after submission
- Supports duplicate-email resubmissions as new attempts

## Environment Variables

For Local Development:

Create `.env` with the following variables:

- `DATABASE_URL`: Neon pooled connection string for app runtime
- `DATABASE_URL_UNPOOLED`: Neon direct connection string for Prisma migrations
- `SENDGRID_API_KEY`: API key from SendGrid
- `EMAIL_FROM`: sender email for confirmation mails (must be a verified sender/domain in SendGrid)
- `APP_URL`: Public base URL for verification links
- `ADMIN_PIN`: Pin for Admin page

For Production:

The same environment variables as shown above are managed in Vercel:

`Project -> Settings -> Environment Variables`


## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create Prisma migration and generate client:

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

3. Load placeholder venues and slots:

```bash
npm run prisma:seed
```

4. Start dev server:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Seed Data

- `npm run prisma:seed` runs the Prisma seed entrypoint in `prisma/seed.ts`.
- Placeholder venue and slot records live in `prisma/seed-data.ts`.
- The seed is idempotent because it uses stable string IDs and Prisma `upsert`, so rerunning it updates the same records instead of creating duplicates.
- Production seeding is blocked by default. To allow it intentionally, set `ALLOW_PRODUCTION_SEED=true` for that run.

## Submission Email Behavior

1. User submits the form
2. Submission + `SubmissionSlot` attempt rows are created
3. Confirmation email is sent via SendGrid
4. If email sending fails, the submission attempt rows are marked `REJECTED`

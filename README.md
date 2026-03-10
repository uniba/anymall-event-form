# Anymall Lunch Event Form

Simple Next.js app for collecting lunch event applications with email verification.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma
- Neon Postgres
- Resend

## What It Does

- Shows event details on the home page
- Collects `email` and `LINE ID`
- Validates email format on both client and server
- Saves application data in Postgres
- Sends verification email with token link
- Verifies users after they click the link
- Prevents duplicate emails via DB unique constraint + server check

## Environment Variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Variables:

- `DATABASE_URL`: Neon pooled connection string for app runtime
- `DIRECT_URL`: Neon direct connection string for Prisma migrations
- `RESEND_API_KEY`: API key from Resend
- `EMAIL_FROM`: sender email for verification mails (must be verified in Resend in production)
- `APP_URL`: base URL used to generate verification link (local: `http://localhost:3000`)

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

3. Start dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Verification Flow

1. User submits email + LINE ID
2. Record is created with `verificationToken` and 24h expiration
3. Verification email is sent via Resend
4. User clicks token link (`/api/verify?token=...`)
5. App marks user as verified and clears token

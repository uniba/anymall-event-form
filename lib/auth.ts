import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { authSessionEventHooks } from "@/lib/auth-session-events";

function getBaseURL(): string {
  return process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required");
  }

  return secret;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  databaseHooks: authSessionEventHooks,
  baseURL: getBaseURL(),
  secret: getAuthSecret(),
  useSecureCookies: isProduction(),
  defaultCookieAttributes: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: isProduction()
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account"
    }
  },
  plugins: [nextCookies()]
});

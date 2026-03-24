import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

function getBaseURL(): string {
  return process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  baseURL: getBaseURL(),
  secret: process.env.BETTER_AUTH_SECRET ?? "development-only-secret-change-me",
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account"
    }
  },
  plugins: [nextCookies()]
});

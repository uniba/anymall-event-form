import type { Session } from "@prisma/client";
import type { BetterAuthOptions, GenericEndpointContext } from "better-auth";
import { prisma } from "@/lib/prisma";

export const AUTH_SESSION_EVENT_TYPES = {
  SIGN_IN: "SIGN_IN",
  SIGN_OUT: "SIGN_OUT",
  SESSION_EXPIRED: "SESSION_EXPIRED"
} as const;

export type AuthSessionEventTypeValue = (typeof AUTH_SESSION_EVENT_TYPES)[keyof typeof AUTH_SESSION_EVENT_TYPES];

type BetterAuthSessionRecord = Pick<Session, "id" | "userId" | "expiresAt"> & Record<string, unknown>;

type RecordAuthSessionEventOptions = {
  session: BetterAuthSessionRecord;
  eventType: AuthSessionEventTypeValue;
  email?: string | null;
  context?: GenericEndpointContext | null;
};

async function findUserEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  return user?.email ?? null;
}

export async function resolveAuthSessionEventEmail(
  session: BetterAuthSessionRecord,
  email?: string | null
): Promise<string | null> {
  if (typeof email !== "undefined") {
    return email;
  }

  return findUserEmail(session.userId);
}

export function classifyDeletedSessionEvent(
  session: BetterAuthSessionRecord,
  context?: Pick<GenericEndpointContext, "path"> | null
): AuthSessionEventTypeValue {
  if (context?.path === "/sign-out") {
    return AUTH_SESSION_EVENT_TYPES.SIGN_OUT;
  }

  if (session.expiresAt < new Date()) {
    return AUTH_SESSION_EVENT_TYPES.SESSION_EXPIRED;
  }

  return AUTH_SESSION_EVENT_TYPES.SIGN_OUT;
}

export async function recordAuthSessionEvent({
  session,
  eventType,
  email,
  context
}: RecordAuthSessionEventOptions): Promise<void> {
  const resolvedEmail = await resolveAuthSessionEventEmail(session, email);

  await prisma.authSessionEvent.create({
    data: {
      userId: session.userId,
      sessionId: session.id,
      eventType,
      email: resolvedEmail
    }
  });
}

export const authSessionEventHooks = {
  session: {
    create: {
      async after(session: BetterAuthSessionRecord, context: GenericEndpointContext | null) {
        try {
          await recordAuthSessionEvent({
          session,
          eventType: AUTH_SESSION_EVENT_TYPES.SIGN_IN,
          context
          });
        } catch (error) {
          console.error("Failed to record auth session event (CREATE)", error);
        }
      }
    },
    delete: {
      async after(session: BetterAuthSessionRecord, context: GenericEndpointContext | null) {
        try {
          await recordAuthSessionEvent({
          session,
          eventType: classifyDeletedSessionEvent(session, context),
          context
          });
        } catch (error) {
          console.error("Failed to record auth session event (DELETE)", error);
        }
      }
    }
  }
} satisfies NonNullable<BetterAuthOptions["databaseHooks"]>;

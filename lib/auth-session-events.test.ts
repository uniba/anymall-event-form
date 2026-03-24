import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_SESSION_EVENT_TYPES,
  authSessionEventHooks,
  classifyDeletedSessionEvent,
  recordAuthSessionEvent,
  resolveAuthSessionEventEmail
} from "./auth-session-events";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    },
    authSessionEvent: {
      create: vi.fn()
    }
  }
}));

describe("auth session event helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("classifies explicit sign-out requests as SIGN_OUT", () => {
    const eventType = classifyDeletedSessionEvent(
      {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000)
      },
      {
        path: "/sign-out"
      } as any
    );

    expect(eventType).toBe(AUTH_SESSION_EVENT_TYPES.SIGN_OUT);
  });

  it("classifies expired deleted sessions as SESSION_EXPIRED", () => {
    const eventType = classifyDeletedSessionEvent(
      {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() - 60_000)
      },
      null
    );

    expect(eventType).toBe(AUTH_SESSION_EVENT_TYPES.SESSION_EXPIRED);
  });

  it("defaults non-expired deletes to SIGN_OUT", () => {
    const eventType = classifyDeletedSessionEvent(
      {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000)
      },
      null
    );

    expect(eventType).toBe(AUTH_SESSION_EVENT_TYPES.SIGN_OUT);
  });

  it("resolves an email snapshot from the user record", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "admin@example.com"
    } as any);

    const email = await resolveAuthSessionEventEmail({
      id: "session-1",
      userId: "user-1",
      expiresAt: new Date()
    });

    expect(email).toBe("admin@example.com");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { email: true }
    });
  });

  it("preserves an explicit email snapshot when the user record is unavailable", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    await recordAuthSessionEvent({
      session: {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date()
      },
      eventType: AUTH_SESSION_EVENT_TYPES.SIGN_OUT,
      email: "admin@example.com"
    });

    expect(prisma.authSessionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        sessionId: "session-1",
        eventType: AUTH_SESSION_EVENT_TYPES.SIGN_OUT,
        email: "admin@example.com"
      })
    });
  });

  it("records sign-in events from the session create hook", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "admin@example.com"
    } as any);

    await authSessionEventHooks.session?.create?.after?.(
      {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000)
      } as any,
      {
        path: "/callback/google"
      } as any
    );

    expect(prisma.authSessionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        sessionId: "session-1",
        eventType: AUTH_SESSION_EVENT_TYPES.SIGN_IN,
        email: "admin@example.com"
      })
    });
  });

  it("records expired session cleanups from the session delete hook", async () => {
    const { prisma } = await import("@/lib/prisma");
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "admin@example.com"
    } as any);

    await authSessionEventHooks.session?.delete?.after?.(
      {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date(Date.now() - 60_000)
      } as any,
      null
    );

    expect(prisma.authSessionEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: AUTH_SESSION_EVENT_TYPES.SESSION_EXPIRED
      })
    });
  });

  it("does not define a session update hook, so session refreshes do not emit sign-in events", () => {
    expect("update" in (authSessionEventHooks.session ?? {})).toBe(false);
  });
});

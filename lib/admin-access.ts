import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { normalizeEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type AdminAuthorization =
  | {
      status: "unauthenticated";
    }
  | {
      status: "unauthorized";
      normalizedEmail: string;
      session: AuthSession;
    }
  | {
      status: "authorized";
      normalizedEmail: string;
      session: AuthSession;
    };

export async function getAdminAuthorizationFromHeaders(authHeaders: Headers): Promise<AdminAuthorization> {
  const session = await auth.api.getSession({
    headers: authHeaders
  });

  if (!session) {
    return {
      status: "unauthenticated"
    };
  }

  const normalizedEmail = normalizeEmail(session.user.email);
  const allowlistEntry = await prisma.adminAllowlist.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (!allowlistEntry) {
    return {
      status: "unauthorized",
      normalizedEmail,
      session
    };
  }

  return {
    status: "authorized",
    normalizedEmail,
    session
  };
}

export async function getRequestAdminAuthorization(request: NextRequest): Promise<AdminAuthorization> {
  return getAdminAuthorizationFromHeaders(request.headers);
}

export async function ensureAdminApiAccess(
  request: NextRequest
): Promise<{ ok: true; session: AuthSession } | { ok: false; response: NextResponse }> {
  const authorization = await getRequestAdminAuthorization(request);

  if (authorization.status === "unauthenticated") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 })
    };
  }

  if (authorization.status === "unauthorized") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin access denied." }, { status: 403 })
    };
  }

  return {
    ok: true,
    session: authorization.session
  };
}

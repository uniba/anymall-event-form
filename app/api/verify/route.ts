import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function redirectWithStatus(request: NextRequest, status: string) {
  const url = new URL("/", request.url);
  url.searchParams.set("verified", status);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return redirectWithStatus(request, "missing_token");
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { verificationToken: token }
    });

    if (!submission) {
      return redirectWithStatus(request, "invalid_token");
    }

    if (submission.verified) {
      return redirectWithStatus(request, "already_verified");
    }

    if (!submission.tokenExpiresAt || submission.tokenExpiresAt < new Date()) {
      return redirectWithStatus(request, "expired_token");
    }

    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verificationToken: null,
        tokenExpiresAt: null
      }
    });

    return redirectWithStatus(request, "success");
  } catch {
    return redirectWithStatus(request, "error");
  }
}


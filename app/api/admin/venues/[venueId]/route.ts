import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const venueAddressMaxLength = 150;

type VenueUpdateInput = {
  name?: unknown;
  address?: unknown;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdminSessionValid = await isValidAdminSessionToken(sessionToken);
  if (!isAdminSessionValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: VenueUpdateInput;
  try {
    body = (await request.json()) as VenueUpdateInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = normalizeText(body.name);
  const address = normalizeText(body.address);

  if (!name || !address) {
    return NextResponse.json({ error: "必須項目を入力してください。" }, { status: 400 });
  }

  if (address.length > venueAddressMaxLength) {
    return NextResponse.json(
      { error: `住所は${venueAddressMaxLength}文字以内で入力してください。` },
      { status: 400 }
    );
  }

  const { venueId } = await context.params;

  const existingVenue = await prisma.venue.findUnique({
    where: {
      id: venueId
    },
    select: {
      id: true
    }
  });

  if (!existingVenue) {
    return NextResponse.json({ error: "会場が見つかりません。" }, { status: 404 });
  }

  const venue = await prisma.venue.update({
    where: {
      id: venueId
    },
    data: {
      name,
      address
    },
    select: {
      id: true,
      name: true,
      address: true
    }
  });

  return NextResponse.json({ venue });
}

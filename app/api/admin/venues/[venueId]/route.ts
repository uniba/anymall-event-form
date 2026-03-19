import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseVenueInput } from "../venue-input";

type VenueUpdateInput = {
  name?: unknown;
  address?: unknown;
};

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

  const parsedInput = parseVenueInput(body);
  if (!parsedInput.data) {
    return NextResponse.json({ error: parsedInput.error }, { status: 400 });
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
      name: parsedInput.data.name,
      address: parsedInput.data.address
    },
    select: {
      id: true,
      name: true,
      address: true
    }
  });

  return NextResponse.json({ venue });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ venueId: string }> }
) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdminSessionValid = await isValidAdminSessionToken(sessionToken);
  if (!isAdminSessionValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

  const existingSlot = await prisma.slot.findFirst({
    where: {
      venueId
    },
    select: {
      id: true
    }
  });

  if (existingSlot) {
    return NextResponse.json(
      { error: "この会場にはスロットが紐づいているため削除できません。先にスロットを削除してください。" },
      { status: 400 }
    );
  }

  await prisma.venue.delete({
    where: {
      id: venueId
    }
  });

  return NextResponse.json({ venueId });
}

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { parseVenueInput } from "./venue-input";

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdminSessionValid = await isValidAdminSessionToken(sessionToken);
  if (!isAdminSessionValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const venues = await prisma.venue.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true
    }
  });

  return NextResponse.json({ venues });
}

type VenueCreateInput = {
  name?: unknown;
  address?: unknown;
};

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdminSessionValid = await isValidAdminSessionToken(sessionToken);
  if (!isAdminSessionValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: VenueCreateInput;
  try {
    body = (await request.json()) as VenueCreateInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsedInput = parseVenueInput(body);
  if (!parsedInput.data) {
    return NextResponse.json({ error: parsedInput.error }, { status: 400 });
  }

  const venue = await prisma.venue.create({
    data: parsedInput.data,
    select: {
      id: true,
      name: true,
      address: true
    }
  });

  return NextResponse.json({ venue }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { validateSlotUpdateInput, type SlotUpdateInput } from "@/lib/admin-slot-validation";
import { prisma } from "@/lib/prisma";
import { toSlotTableRow } from "./slot-response";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdminSessionValid = await isValidAdminSessionToken(sessionToken);
  if (!isAdminSessionValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: SlotUpdateInput;
  try {
    body = (await request.json()) as SlotUpdateInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validated = validateSlotUpdateInput(body);
  if (!validated.data) {
    return NextResponse.json({ error: validated.error ?? "Invalid slot data." }, { status: 400 });
  }

  const venue = await prisma.venue.findUnique({
    where: { id: validated.data.venueId },
    select: { id: true }
  });

  if (!venue) {
    return NextResponse.json({ error: "会場が見つかりません。" }, { status: 404 });
  }

  const slot = await prisma.slot.create({
    data: {
      eventName: validated.data.eventName,
      venueId: validated.data.venueId,
      theme: validated.data.theme,
      instructor: validated.data.instructor,
      capacity: validated.data.capacity,
      applicationBegin: validated.data.applicationBegin,
      applicationDeadline: validated.data.applicationDeadline,
      lotteryResultTime: validated.data.lotteryResultTime,
      startsAt: validated.data.startsAt,
      endsAt: validated.data.endsAt,
      state: validated.data.state
    },
    include: {
      venue: {
        select: {
          name: true
        }
      }
    }
  });

  return NextResponse.json({ slot: toSlotTableRow(slot) }, { status: 201 });
}

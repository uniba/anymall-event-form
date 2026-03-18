import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { validateSlotUpdateInput, type SlotUpdateInput } from "@/lib/admin-slot-validation";

function toSlotTableRow(slot: {
  id: string;
  eventName: string;
  venueId: string;
  venue: { name: string };
  theme: string;
  instructor: string;
  capacity: number;
  applicationBegin: Date;
  applicationDeadline: Date;
  lotteryResultTime: Date;
  startsAt: Date;
  endsAt: Date;
  state: "APPLICATIONS_CLOSED" | "ACCEPTING_APPLICATIONS";
}) {
  return {
    id: slot.id,
    eventName: slot.eventName,
    venueId: slot.venueId,
    venueName: slot.venue.name,
    theme: slot.theme,
    instructor: slot.instructor,
    capacity: slot.capacity,
    applicationBegin: slot.applicationBegin.toISOString(),
    applicationDeadline: slot.applicationDeadline.toISOString(),
    lotteryResultTime: slot.lotteryResultTime.toISOString(),
    startsAt: slot.startsAt.toISOString(),
    endsAt: slot.endsAt.toISOString(),
    state: slot.state
  };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slotId: string }> }
) {
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

  const { slotId } = await context.params;

  const [slot, venue] = await Promise.all([
    prisma.slot.findUnique({
      where: { id: slotId },
      select: { id: true }
    }),
    prisma.venue.findUnique({
      where: { id: validated.data.venueId },
      select: { id: true }
    })
  ]);

  if (!slot) {
    return NextResponse.json({ error: "スロットが見つかりません。" }, { status: 404 });
  }

  if (!venue) {
    return NextResponse.json({ error: "会場が見つかりません。" }, { status: 404 });
  }

  const updatedSlot = await prisma.slot.update({
    where: { id: slotId },
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

  return NextResponse.json({ slot: toSlotTableRow(updatedSlot) });
}

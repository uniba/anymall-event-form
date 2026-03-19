import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { validateSlotUpdateInput, type SlotUpdateInput } from "@/lib/admin-slot-validation";
import { toSlotTableRow } from "../slot-response";

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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slotId: string }> }
) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdminSessionValid = await isValidAdminSessionToken(sessionToken);
  if (!isAdminSessionValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { slotId } = await context.params;

  const existingSlot = await prisma.slot.findUnique({
    where: { id: slotId },
    select: { id: true }
  });

  if (!existingSlot) {
    return NextResponse.json({ error: "スロットが見つかりません。" }, { status: 404 });
  }

  const existingApplication = await prisma.submissionSlot.findFirst({
    where: { slotId },
    select: { id: true }
  });

  if (existingApplication) {
    return NextResponse.json(
      { error: "このスロットには応募データが紐づいているため削除できません。先に応募データを削除してください。" },
      { status: 400 }
    );
  }

  await prisma.slot.delete({
    where: { id: slotId }
  });

  return NextResponse.json({ slotId });
}

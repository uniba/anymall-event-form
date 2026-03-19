import { randomUUID } from "node:crypto";
import { Prefecture, Prisma, SlotApplicationStatus, SlotState } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import type { GenderInput } from "@/lib/labels";
import { sendApplicationReceivedEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import {
  isValidEmail,
  isValidGenderInput,
  isValidKatakanaName,
  isValidMemo,
  isValidPrefecture,
  normalizeMemo,
  parseBirthday,
  toStoredGender
} from "@/lib/validation";

type CreateApplicationBody = {
  name?: string;
  furigana?: string;
  email?: string;
  birthday?: string;
  gender?: string;
  prefecture?: string;
  memo?: string;
  selectedSlotIds?: unknown;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function createDuplicateSubmissionAttemptRows(
  submissionId: string,
  selectedSlotIds: string[],
  submissionAttemptId: string
): Promise<void> {
  const existingSlotApplications = await prisma.submissionSlot.findMany({
    where: { submissionId },
    select: { slotId: true, status: true}
  });
  const existingSlotIdSet = new Set(existingSlotApplications.map((row) => row.slotId));

  const hasAcceptedSlot = existingSlotApplications.some(
    (row) => row.status === SlotApplicationStatus.ACCEPTED
  );

  await prisma.submissionSlot.createMany({
    data: selectedSlotIds.map((slotId) => ({
      submissionId,
      slotId,
      submissionAttemptId,
      status: hasAcceptedSlot || existingSlotIdSet.has(slotId)
        ? SlotApplicationStatus.REJECTED
        : SlotApplicationStatus.APPLIED
    })),
    skipDuplicates: true
  });
}

async function markAttemptReceiptSent(submissionId: string, submissionAttemptId: string): Promise<void> {
  await prisma.submissionSlot.updateMany({
    where: {
      submissionId,
      submissionAttemptId
    },
    data: {
      receiptEmailSentAt: new Date()
    }
  });
}

async function rejectAttemptRows(submissionId: string, submissionAttemptId: string): Promise<void> {
  await prisma.submissionSlot.updateMany({
    where: {
      submissionId,
      submissionAttemptId
    },
    data: {
      status: SlotApplicationStatus.REJECTED,
      receiptEmailSentAt: null
    }
  });
}

type SlotInfoForEmail = {
  venueName: string;
  eventName: string;
  startsAt: Date;
  endsAt: Date;
};

async function fetchSlotsForEmail(slotIds: string[]): Promise<SlotInfoForEmail[]> {
  const slots = await prisma.slot.findMany({
    where: { id: { in: slotIds } },
    include: { venue: true },
    orderBy: { startsAt: "asc" }
  });

  return slots.map((slot) => ({
    venueName: slot.venue.name,
    eventName: slot.eventName,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt
  }));
}

async function sendReceiptOrRejectAttempt(
  submissionId: string,
  submissionAttemptId: string,
  email: string,
  applicantName: string,
  slotIds: string[]
): Promise<{ emailSent: boolean; warning?: string }> {
  try {
    const slots = await fetchSlotsForEmail(slotIds);
    await sendApplicationReceivedEmail({ to: email, applicantName, slots });
    await markAttemptReceiptSent(submissionId, submissionAttemptId);
    return { emailSent: true };
  } catch {
    await rejectAttemptRows(submissionId, submissionAttemptId);
    return {
      emailSent: false,
      warning:
        "Application was received, but we could not send a confirmation email. The new application attempt was marked as rejected."
    };
  }
}

export async function POST(request: NextRequest) {
  let body: CreateApplicationBody;

  try {
    body = (await request.json()) as CreateApplicationBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = normalizeText(body.name);
  const furigana = normalizeText(body.furigana);
  const email = normalizeText(body.email).toLowerCase();
  const birthdayInput = normalizeText(body.birthday);
  const gender = normalizeText(body.gender);
  const prefecture = normalizeText(body.prefecture);
  const memo = normalizeMemo(normalizeText(body.memo));
  const selectedSlotIdsInput = body.selectedSlotIds;
  const birthday = birthdayInput ? parseBirthday(birthdayInput) : null;

  if (!name.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (!isValidKatakanaName(furigana)) {
    return NextResponse.json({ error: "Furigana must use katakana only." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  if (birthdayInput && !birthday) {
    return NextResponse.json({ error: "Invalid birthday." }, { status: 400 });
  }

  let storedGender: ReturnType<typeof toStoredGender> | null = null;
  if (gender) {
    if (!isValidGenderInput(gender)) {
      return NextResponse.json({ error: "Invalid gender value." }, { status: 400 });
    }
    storedGender = toStoredGender(gender as GenderInput);
  }

  if (prefecture && !isValidPrefecture(prefecture)) {
    return NextResponse.json({ error: "Invalid prefecture value." }, { status: 400 });
  }

  if (memo && !isValidMemo(memo)) {
    return NextResponse.json({ error: "Memo must be 150 characters or fewer." }, { status: 400 });
  }

  if (!Array.isArray(selectedSlotIdsInput)) {
    return NextResponse.json({ error: "At least one slot must be selected." }, { status: 400 });
  }

  const selectedSlotIds = selectedSlotIdsInput.map((value) => normalizeText(value));

  if (selectedSlotIds.length === 0 || selectedSlotIds.some((slotId) => !slotId)) {
    return NextResponse.json({ error: "At least one slot must be selected." }, { status: 400 });
  }

  if (new Set(selectedSlotIds).size !== selectedSlotIds.length) {
    return NextResponse.json({ error: "Selected slots must be unique." }, { status: 400 });
  }

  const availableSlots = await prisma.slot.findMany({
    where: {
      id: {
        in: selectedSlotIds
      },
      state: SlotState.ACCEPTING_APPLICATIONS
    },
    select: {
      id: true
    }
  });

  if (availableSlots.length !== selectedSlotIds.length) {
    return NextResponse.json(
      { error: "One or more selected slots are invalid or unavailable." },
      { status: 400 }
    );
  }

  const submissionAttemptId = randomUUID();
  const existing = await prisma.submission.findUnique({
    where: { email },
    select: { id: true }
  });
  if (existing) {
    await createDuplicateSubmissionAttemptRows(existing.id, selectedSlotIds, submissionAttemptId);
    const receiptResult = await sendReceiptOrRejectAttempt(
      existing.id,
      submissionAttemptId,
      email,
      name,
      selectedSlotIds
    );
    return NextResponse.json({ ok: true, ...receiptResult }, { status: 200 });
  }

  try {
    const created = await prisma.submission.create({
      data: {
        name,
        furigana,
        email,
        gender: storedGender ?? undefined,
        birthday: birthday ?? undefined,
        prefecture: prefecture ? (prefecture as Prefecture) : undefined,
        memo: memo || undefined,
        slotApplications: {
          create: selectedSlotIds.map((slotId) => ({
            slotId,
            submissionAttemptId,
            status: SlotApplicationStatus.APPLIED
          }))
        }
      }
    });

    const receiptResult = await sendReceiptOrRejectAttempt(
      created.id,
      submissionAttemptId,
      email,
      name,
      selectedSlotIds
    );
    return NextResponse.json({ ok: true, ...receiptResult }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingSubmission = await prisma.submission.findUnique({
        where: { email },
        select: { id: true }
      });

      if (existingSubmission) {
        await createDuplicateSubmissionAttemptRows(
          existingSubmission.id,
          selectedSlotIds,
          submissionAttemptId
        ).catch(() => {});
        const receiptResult = await sendReceiptOrRejectAttempt(
          existingSubmission.id,
          submissionAttemptId,
          email,
          name,
          selectedSlotIds
        );
        return NextResponse.json({ ok: true, ...receiptResult }, { status: 200 });
      }
    }

    return NextResponse.json(
      { error: "Unable to process your submission right now." },
      { status: 500 }
    );
  }
}

import { randomUUID } from "node:crypto";
import { Prisma, SlotApplicationStatus, SlotState } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { isValidEmail, isValidGender, isValidKatakanaName, parseBirthday } from "@/lib/validation";

type CreateApplicationBody = {
  name?: string;
  email?: string;
  birthday?: string;
  gender?: string;
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
    select: { slotId: true }
  });
  const existingSlotIdSet = new Set(existingSlotApplications.map((row) => row.slotId));

  await prisma.submissionSlot.createMany({
    data: selectedSlotIds.map((slotId) => ({
      submissionId,
      slotId,
      submissionAttemptId,
      status: existingSlotIdSet.has(slotId)
        ? SlotApplicationStatus.REJECTED
        : SlotApplicationStatus.APPLIED
    })),
    skipDuplicates: true
  });
}

export async function POST(request: NextRequest) {
  let body: CreateApplicationBody;

  try {
    body = (await request.json()) as CreateApplicationBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = normalizeText(body.name);
  const email = normalizeText(body.email).toLowerCase();
  const birthdayInput = normalizeText(body.birthday);
  const gender = normalizeText(body.gender);
  const selectedSlotIdsInput = body.selectedSlotIds;
  const birthday = parseBirthday(birthdayInput);

  if (!isValidKatakanaName(name)) {
    return NextResponse.json({ error: "Name must use katakana only." }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  if (!birthday) {
    return NextResponse.json({ error: "Invalid birthday." }, { status: 400 });
  }

  if (!isValidGender(gender)) {
    return NextResponse.json({ error: "Invalid gender value." }, { status: 400 });
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
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const token = randomUUID();
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const baseUrl = (process.env.APP_URL ?? request.nextUrl.origin).replace(/\/$/, "");

  try {
    const created = await prisma.submission.create({
      data: {
        name,
        email,
        gender,
        birthday,
        verificationToken: token,
        tokenExpiresAt,
        slotApplications: {
          create: selectedSlotIds.map((slotId) => ({
            slotId,
            submissionAttemptId,
            status: SlotApplicationStatus.APPLIED
          }))
        }
      }
    });

    try {
      await sendVerificationEmail({
        to: email,
        token,
        baseUrl
      });
    } catch (emailError) {
      await prisma.submission.delete({ where: { id: created.id } }).catch(() => {});
      throw emailError;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
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
        return NextResponse.json({ ok: true }, { status: 200 });
      }
    }

    return NextResponse.json(
      { error: "Unable to process your submission right now." },
      { status: 500 }
    );
  }
}

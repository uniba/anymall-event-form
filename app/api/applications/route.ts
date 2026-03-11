import { randomUUID } from "node:crypto";
import { Prisma, SlotApplicationStatus, SlotState } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { isValidEmail, isValidKatakanaName, isValidSex, parseBirthday } from "@/lib/validation";

type CreateApplicationBody = {
  name?: string;
  email?: string;
  birthday?: string;
  sex?: string;
  preferredSlot1?: string;
  preferredSlot2?: string;
  preferredSlot3?: string;
};

type PreferredSlotSelection = {
  slotId: string;
  preferenceRank: 1 | 2 | 3;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
  const sex = normalizeText(body.sex);
  const preferredSlot1 = normalizeText(body.preferredSlot1);
  const preferredSlot2 = normalizeText(body.preferredSlot2);
  const preferredSlot3 = normalizeText(body.preferredSlot3);
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

  if (!isValidSex(sex)) {
    return NextResponse.json({ error: "Invalid sex value." }, { status: 400 });
  }

  if (!preferredSlot1) {
    return NextResponse.json({ error: "Preferred Slot 1 is required." }, { status: 400 });
  }

  const selections: PreferredSlotSelection[] = [
    { slotId: preferredSlot1, preferenceRank: 1 },
    ...(preferredSlot2 ? [{ slotId: preferredSlot2, preferenceRank: 2 as const }] : []),
    ...(preferredSlot3 ? [{ slotId: preferredSlot3, preferenceRank: 3 as const }] : [])
  ];
  const slotIds = selections.map((selection) => selection.slotId);
  const now = new Date();

  if (new Set(slotIds).size !== slotIds.length) {
    return NextResponse.json({ error: "Preferred slots must be unique." }, { status: 400 });
  }

  const existingSlots = await prisma.slot.findMany({
    where: {
      id: {
        in: slotIds
      },
      state: SlotState.ACCEPTING_APPLICATIONS,
      applicationBegin: {
        lte: now
      },
      applicationDeadline: {
        gte: now
      }
    },
    select: {
      id: true
    }
  });

  if (existingSlots.length !== slotIds.length) {
    return NextResponse.json({ error: "One or more selected slots are invalid." }, { status: 400 });
  }

  const existing = await prisma.submission.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
  }

  const token = randomUUID();
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const baseUrl = (process.env.APP_URL ?? request.nextUrl.origin).replace(/\/$/, "");

  try {
    const created = await prisma.submission.create({
      data: {
        name,
        email,
        gender: sex,
        birthday,
        verificationToken: token,
        tokenExpiresAt,
        slotApplications: {
          create: selections.map((selection) => ({
            slotId: selection.slotId,
            preferenceRank: selection.preferenceRank,
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
      return NextResponse.json({ error: "This email is already registered." }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Unable to process your submission right now." },
      { status: 500 }
    );
  }
}

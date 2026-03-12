import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { isValidEmail, isValidKatakanaName, isValidSex, parseBirthday } from "@/lib/validation";

type CreateApplicationBody = {
  name?: string;
  email?: string;
  birthday?: string;
  sex?: string;
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
        tokenExpiresAt
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

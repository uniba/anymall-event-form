import { Gender, Prefecture } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isValidAdminSessionToken,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  calculateAge,
  isValidEmail,
  isValidPrefecture,
  parseBirthday,
} from "@/lib/validation";

type SubmissionUpdateInput = {
  name?: unknown;
  furigana?: unknown;
  email?: unknown;
  gender?: unknown;
  birthday?: unknown;
  prefecture?: unknown;
  memo?: unknown;
};

const genderOptions = Object.values(Gender);

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isGender(value: string): value is Gender {
  return genderOptions.includes(value as Gender);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> },
) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdminSessionValid = await isValidAdminSessionToken(sessionToken);
  if (!isAdminSessionValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: SubmissionUpdateInput;
  try {
    body = (await request.json()) as SubmissionUpdateInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const name = normalizeText(body.name);
  const furigana = normalizeText(body.furigana);
  const email = normalizeText(body.email);
  const gender = normalizeText(body.gender);
  const birthdayInput = normalizeText(body.birthday);
  const prefecture = normalizeText(body.prefecture);
  const memo = typeof body.memo === "string" ? body.memo.trim() : null;
  const birthday = parseBirthday(birthdayInput);

  if (!name || !furigana || !email || !gender || !birthdayInput || !prefecture) {
    return NextResponse.json(
      { error: "必須項目を入力してください。" },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "有効なメールアドレスを入力してください。" },
      { status: 400 },
    );
  }

  if (!isGender(gender)) {
    return NextResponse.json({ error: "性別が不正です。" }, { status: 400 });
  }

  if (!birthday) {
    return NextResponse.json({ error: "誕生日が不正です。" }, { status: 400 });
  }

  const age = calculateAge(birthday);
  if (age < 18 || age > 100) {
    return NextResponse.json(
      { error: "年齢は18から100までにしてください。" },
      { status: 400 },
    );
  }

  if (!isValidPrefecture(prefecture)) {
    return NextResponse.json({ error: "居住地が不正です。" }, { status: 400 });
  }

  const { submissionId } = await context.params;

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      id: submissionId,
    },
    select: {
      id: true,
    },
  });

  if (!existingSubmission) {
    return NextResponse.json(
      { error: "申込が見つかりません。" },
      { status: 404 },
    );
  }

  const submission = await prisma.submission.update({
    where: {
      id: submissionId,
    },
    data: {
      name,
      furigana,
      email,
      gender,
      birthday,
      prefecture: prefecture as Prefecture,
      memo: memo || null,
    },
    select: {
      id: true,
      name: true,
      furigana: true,
      email: true,
      gender: true,
      birthday: true,
      prefecture: true,
      memo: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    submission: {
      id: submission.id,
      name: submission.name,
      furigana: submission.furigana,
      email: submission.email,
      gender: submission.gender,
      age: submission.birthday ? calculateAge(submission.birthday) : null,
      prefecture: submission.prefecture,
      birthday: submission.birthday?.toISOString() ?? "",
      memo: submission.memo,
      createdAt: submission.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ submissionId: string }> }
) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdminSessionValid = await isValidAdminSessionToken(sessionToken);
  if (!isAdminSessionValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { submissionId } = await context.params;

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      id: submissionId
    },
    select: {
      id: true
    }
  });

  if (!existingSubmission) {
    return NextResponse.json({ error: "申込が見つかりません。" }, { status: 404 });
  }

  const existingApplication = await prisma.submissionSlot.findFirst({
    where: {
      submissionId
    },
    select: {
      id: true
    }
  });

  if (existingApplication) {
    return NextResponse.json(
      { error: "この申込には応募データが紐づいているため削除できません。先に応募データを削除してください。" },
      { status: 400 }
    );
  }

  await prisma.submission.delete({
    where: {
      id: submissionId
    }
  });

  return NextResponse.json({ submissionId });
}

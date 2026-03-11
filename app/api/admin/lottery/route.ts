import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSessionToken } from "@/lib/admin-auth";
import { LotteryError, runSlotLottery } from "@/lib/lottery";

type RunLotteryBody = {
  targetSlotId?: string;
  successCount?: number;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseSuccessCount(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdminSessionValid = await isValidAdminSessionToken(sessionToken);
  if (!isAdminSessionValid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: RunLotteryBody;
  try {
    body = (await request.json()) as RunLotteryBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const targetSlotId = normalizeText(body.targetSlotId);
  const successCount = parseSuccessCount(body.successCount);

  if (!targetSlotId) {
    return NextResponse.json({ error: "Please select a slot." }, { status: 400 });
  }

  if (successCount === null) {
    return NextResponse.json(
      { error: "Success count must be a non-negative integer." },
      { status: 400 }
    );
  }

  try {
    const result = await runSlotLottery({
      targetSlotId,
      successCount
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof LotteryError) {
      if (error.code === "SLOT_NOT_FOUND") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to run lottery right now." }, { status: 500 });
  }
}

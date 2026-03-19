import { SlotState } from "@prisma/client";
import { getAdminSlotDateInputValue } from "@/lib/slot-display";

export const slotStateOptions = Object.values(SlotState);
export const slotThemeMaxLength = 150;
export const slotCapacityMax = 100;

export type SlotUpdateInput = {
  eventName?: unknown;
  venueId?: unknown;
  theme?: unknown;
  instructor?: unknown;
  capacity?: unknown;
  applicationBegin?: unknown;
  applicationDeadline?: unknown;
  lotteryResultTime?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  state?: unknown;
};

export type ValidatedSlotUpdate = {
  eventName: string;
  venueId: string;
  theme: string;
  instructor: string;
  capacity: number;
  applicationBegin: Date;
  applicationDeadline: Date;
  lotteryResultTime: Date;
  startsAt: Date;
  endsAt: Date;
  state: SlotState;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseCapacity(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > slotCapacityMax) {
    return null;
  }

  return parsed;
}

function parseDateTime(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSlotState(value: string): value is SlotState {
  return slotStateOptions.includes(value as SlotState);
}

function isSameJstDate(left: Date, right: Date): boolean {
  return getAdminSlotDateInputValue(left) === getAdminSlotDateInputValue(right);
}

export function validateSlotUpdateInput(input: SlotUpdateInput): {
  data?: ValidatedSlotUpdate;
  error?: string;
} {
  const eventName = normalizeText(input.eventName);
  const venueId = normalizeText(input.venueId);
  const theme = normalizeText(input.theme);
  const instructor = normalizeText(input.instructor);
  const stateValue = normalizeText(input.state);
  const capacity = parseCapacity(input.capacity);
  const applicationBegin = parseDateTime(input.applicationBegin);
  const applicationDeadline = parseDateTime(input.applicationDeadline);
  const lotteryResultTime = parseDateTime(input.lotteryResultTime);
  const startsAt = parseDateTime(input.startsAt);
  const endsAt = parseDateTime(input.endsAt);

  if (!eventName || !venueId || !theme || !instructor || !stateValue) {
    return { error: "必須項目を入力してください。" };
  }

  if (theme.length > slotThemeMaxLength) {
    return { error: `テーマは${slotThemeMaxLength}文字以内で入力してください。` };
  }

  if (capacity === null) {
    return { error: `定員は0から${slotCapacityMax}までの整数で入力してください。` };
  }

  if (!applicationBegin || !applicationDeadline || !lotteryResultTime || !startsAt || !endsAt) {
    return { error: "日時を正しく入力してください。" };
  }

  if (!isSlotState(stateValue)) {
    return { error: "状態が不正です。" };
  }

  if (applicationBegin.getTime() > applicationDeadline.getTime()) {
    return { error: "応募開始日時は応募締切日時以前にしてください。" };
  }

  if (getAdminSlotDateInputValue(lotteryResultTime) >= getAdminSlotDateInputValue(startsAt)) {
    return { error: "抽選日は開催日より前にしてください。" };
  }

  if (startsAt.getTime() >= endsAt.getTime()) {
    return { error: "開催終了時間は開催開始時間より後にしてください。" };
  }

  if (!isSameJstDate(startsAt, endsAt)) {
    return { error: "開催日時は同じ日付内で入力してください。" };
  }

  return {
    data: {
      eventName,
      venueId,
      theme,
      instructor,
      capacity,
      applicationBegin,
      applicationDeadline,
      lotteryResultTime,
      startsAt,
      endsAt,
      state: stateValue
    }
  };
}

import { Prefecture } from "@prisma/client";
import type { SlotApplicationStatus, SlotState } from "@prisma/client";

export type GenderInput = "male" | "female" | "unspecified";
export type StoredGender = "MALE" | "FEMALE" | "UNSPECIFIED";

export const slotStateLabels: Record<SlotState, string> = {
  ACCEPTING_APPLICATIONS: "受付中",
  APPLICATIONS_CLOSED: "受付終了"
};

export const slotApplicationStatusLabels: Record<SlotApplicationStatus, string> = {
  APPLIED: "応募済み",
  WAITLISTED: "キャンセル待ち",
  ACCEPTED: "当選",
  REJECTED: "落選",
  CANCELED: "キャンセル"
};

export const genderLabels: Record<StoredGender, string> = {
  MALE: "男性",
  FEMALE: "女性",
  UNSPECIFIED: "未回答"
};

export const genderInputToEnum: Record<GenderInput, StoredGender> = {
  male: "MALE",
  female: "FEMALE",
  unspecified: "UNSPECIFIED"
};

export const prefectureOptions = Object.values(Prefecture);

export function getSlotStateLabel(value: SlotState): string {
  return slotStateLabels[value];
}

export function getSlotApplicationStatusLabel(value: SlotApplicationStatus): string {
  return slotApplicationStatusLabels[value];
}

export function getGenderLabel(value: StoredGender): string {
  return genderLabels[value];
}

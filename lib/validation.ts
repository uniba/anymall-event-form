import { genderInputToEnum, type GenderInput } from "@/lib/labels";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const katakanaPattern = /^[\u30A0-\u30FFー・\s]+$/;
const birthdayPattern = /^\d{4}-\d{2}-\d{2}$/;

export function isValidEmail(email: string): boolean {
  return emailPattern.test(email);
}

export function isValidKatakanaName(name: string): boolean {
  return katakanaPattern.test(name) && name.trim().length > 0;
}

export function isValidGenderInput(value: string): value is GenderInput {
  return value === "male" || value === "female" || value === "unspecified";
}

export function toStoredGender(value: GenderInput) {
  return genderInputToEnum[value];
}

export function parseBirthday(value: string): Date | null {
  if (!birthdayPattern.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10) === value ? parsed : null;
}

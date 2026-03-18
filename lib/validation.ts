import { genderInputToEnum, prefectureOptions, type GenderInput } from "@/lib/labels";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const katakanaPattern = /^[\u30A0-\u30FFー・\s]+$/;
const birthdayPattern = /^\d{4}-\d{2}-\d{2}$/;
const memoMaxLength = 150;

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

export function isValidPrefecture(value: string): boolean {
  return prefectureOptions.includes(value as (typeof prefectureOptions)[number]);
}

export function normalizeMemo(value: string): string | null {
  const normalized = value.trim();
  return normalized.length === 0 ? null : normalized;
}

export function isValidMemo(value: string | null): boolean {
  return value === null || value.length <= memoMaxLength;
}

export function getMemoMaxLength(): number {
  return memoMaxLength;
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

export function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
}

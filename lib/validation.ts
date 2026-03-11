const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const katakanaPattern = /^[\u30A0-\u30FFー・\s]+$/;
const birthdayPattern = /^\d{4}-\d{2}-\d{2}$/;

export type Sex = "male" | "female";

export function isValidEmail(email: string): boolean {
  return emailPattern.test(email);
}

export function isValidKatakanaName(name: string): boolean {
  return katakanaPattern.test(name) && name.trim().length > 0;
}

export function isValidSex(value: string): value is Sex {
  return value === "male" || value === "female";
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

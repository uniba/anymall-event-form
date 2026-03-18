"use client";

import { FormEvent, useState } from "react";
import { prefectureOptions, type GenderInput } from "@/lib/labels";
import { getMemoMaxLength } from "@/lib/validation";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const katakanaPattern = /^[\u30A0-\u30FFー・\s]+$/;

export type AvailableSlotOption = {
  id: string;
  label: string;
};

type ApplicationFormProps = {
  slotOptions: AvailableSlotOption[];
};

export function ApplicationForm({ slotOptions }: ApplicationFormProps) {
  const hasAvailableSlots = slotOptions.length > 0;
  const memoMaxLength = getMemoMaxLength();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"" | GenderInput>("");
  const [prefecture, setPrefecture] = useState("");
  const [memo, setMemo] = useState("");
  const [selectedSlotIds, setSelectedSlotIds] = useState<Array<string>>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSlotSet = new Set(selectedSlotIds);

  function toggleSlot(slotId: string) {
    setSelectedSlotIds((current) => {
      if (current.includes(slotId)) {
        return current.filter((id) => id !== slotId);
      }

      return [...current, slotId];
    });
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedBirthday = birthday.trim();
    const normalizedGender = gender.trim();
    const normalizedPrefecture = prefecture.trim();
    const normalizedMemo = memo.trim();
    const dedupedSelectedSlotIds = Array.from(new Set(selectedSlotIds));

    if (!katakanaPattern.test(normalizedName)) {
      setError("Name must use katakana only.");
      return;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    if (!normalizedBirthday) {
      setError("Birthday is required.");
      return;
    }

    if (
      normalizedGender !== "male" &&
      normalizedGender !== "female" &&
      normalizedGender !== "unspecified"
    ) {
      setError("Select a valid gender.");
      return;
    }

    if (!prefectureOptions.includes(normalizedPrefecture as (typeof prefectureOptions)[number])) {
      setError("Select a valid prefecture.");
      return;
    }

    if (normalizedMemo.length > memoMaxLength) {
      setError(`Memo must be ${memoMaxLength} characters or fewer.`);
      return;
    }

    if (!hasAvailableSlots) {
      setError("No slots are currently available.");
      return;
    }

    if (dedupedSelectedSlotIds.length === 0) {
      setError("Select at least one slot.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          birthday: normalizedBirthday,
          gender: normalizedGender,
          prefecture: normalizedPrefecture,
          memo: normalizedMemo,
          selectedSlotIds: dedupedSelectedSlotIds
        })
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string; warning?: string }
        | null;

      if (response.ok) {
        const successMessage = data?.warning
          ? `Application received. ${data.warning}`
          : "Application received. A confirmation email has been sent.";
        setSuccess(successMessage);
        setName("");
        setEmail("");
        setBirthday("");
        setGender("");
        setPrefecture("");
        setMemo("");
        setSelectedSlotIds([]);
        return;
      }

      setError(data?.error ?? "Submission failed.");
    } catch {
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-4 space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="name">
          Name (Katakana)
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="ヤマダ タロウ"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="email">
          Email
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="birthday">
          Birthday
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          id="birthday"
          type="date"
          value={birthday}
          onChange={(event) => setBirthday(event.target.value)}
          required
        />
      </div>

      <div>
        <p className="mb-1 block text-sm font-medium text-slate-800">Gender</p>
        <div className="flex items-center gap-4 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input
              checked={gender === "male"}
              name="gender"
              onChange={() => setGender("male")}
              type="radio"
              value="male"
            />
            Male
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              checked={gender === "female"}
              name="gender"
              onChange={() => setGender("female")}
              type="radio"
              value="female"
            />
            Female
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              checked={gender === "unspecified"}
              name="gender"
              onChange={() => setGender("unspecified")}
              type="radio"
              value="unspecified"
            />
            Unspecified
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="prefecture">
          都道府県
        </label>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          id="prefecture"
          onChange={(event) => setPrefecture(event.target.value)}
          required
          value={prefecture}
        >
          <option value="">選択してください</option>
          {prefectureOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="memo">
          メモ
        </label>
        <textarea
          className="min-h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          id="memo"
          maxLength={memoMaxLength}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="ご要望があればご記入ください"
          value={memo}
        />
        <p className="mt-1 text-xs text-slate-500">{memo.length}/{memoMaxLength}</p>
      </div>

      <div>
        <p className="mb-1 block text-sm font-medium text-slate-800">Available Slots</p>
        {hasAvailableSlots ? (
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-300 p-3">
            {slotOptions.map((slot) => (
              <label className="flex items-start gap-2 text-sm text-slate-700" key={slot.id}>
                <input
                  checked={selectedSlotSet.has(slot.id)}
                  disabled={isSubmitting}
                  onChange={() => toggleSlot(slot.id)}
                  type="checkbox"
                  value={slot.id}
                />
                <span>{slot.label}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            No slots are currently available.
          </p>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        type="submit"
        disabled={isSubmitting || !hasAvailableSlots}
      >
        {isSubmitting ? "Submitting..." : "Apply"}
      </button>
    </form>
  );
}

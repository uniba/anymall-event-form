"use client";

import { FormEvent, useState } from "react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const katakanaPattern = /^[\u30A0-\u30FFー・\s]+$/;

export type AvailableSlotOption = {
  id: string;
  label: string;
};

type ApplicationFormProps = {
  slotOptions: AvailableSlotOption[];
};

function hasDuplicateSelections(values: Array<string>): boolean {
  const selected = values.filter(Boolean);
  return new Set(selected).size !== selected.length;
}

export function ApplicationForm({ slotOptions }: ApplicationFormProps) {
  const hasAvailableSlots = slotOptions.length > 0;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [sex, setSex] = useState<"" | "male" | "female">("");
  const [preferredSlot1, setPreferredSlot1] = useState("");
  const [preferredSlot2, setPreferredSlot2] = useState("");
  const [preferredSlot3, setPreferredSlot3] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasDuplicates = hasDuplicateSelections([preferredSlot1, preferredSlot2, preferredSlot3]);

  function isOptionDisabled(slotId: string, fieldIndex: 1 | 2 | 3): boolean {
    const selectedByOtherFields = [
      fieldIndex === 1 ? "" : preferredSlot1,
      fieldIndex === 2 ? "" : preferredSlot2,
      fieldIndex === 3 ? "" : preferredSlot3
    ];

    return selectedByOtherFields.includes(slotId);
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedBirthday = birthday.trim();
    const normalizedSex = sex.trim();
    const normalizedSlot1 = preferredSlot1.trim();
    const normalizedSlot2 = preferredSlot2.trim();
    const normalizedSlot3 = preferredSlot3.trim();

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

    if (normalizedSex !== "male" && normalizedSex !== "female") {
      setError("Select a valid sex.");
      return;
    }

    if (!normalizedSlot1) {
      setError("Preferred Slot 1 is required.");
      return;
    }

    if (hasDuplicateSelections([normalizedSlot1, normalizedSlot2, normalizedSlot3])) {
      setError("Preferred slots must be unique.");
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
          sex: normalizedSex,
          preferredSlot1: normalizedSlot1,
          preferredSlot2: normalizedSlot2 || undefined,
          preferredSlot3: normalizedSlot3 || undefined
        })
      });

      if (response.ok) {
        setSuccess("Thanks. Please check your inbox and click the verification link.");
        setName("");
        setEmail("");
        setBirthday("");
        setSex("");
        setPreferredSlot1("");
        setPreferredSlot2("");
        setPreferredSlot3("");
        return;
      }

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
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
        <p className="mb-1 block text-sm font-medium text-slate-800">Sex</p>
        <div className="flex items-center gap-4 text-sm text-slate-700">
          <label className="inline-flex items-center gap-2">
            <input
              checked={sex === "male"}
              name="sex"
              onChange={() => setSex("male")}
              type="radio"
              value="male"
            />
            Male
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              checked={sex === "female"}
              name="sex"
              onChange={() => setSex("female")}
              type="radio"
              value="female"
            />
            Female
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="preferred-slot-1">
          Preferred Slot 1 (Required)
        </label>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          disabled={!hasAvailableSlots}
          id="preferred-slot-1"
          onChange={(event) => setPreferredSlot1(event.target.value)}
          required
          value={preferredSlot1}
        >
          <option value="">{hasAvailableSlots ? "Select a slot" : "No available slots"}</option>
          {slotOptions.map((slot) => (
            <option disabled={isOptionDisabled(slot.id, 1)} key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="preferred-slot-2">
          Preferred Slot 2 (Optional)
        </label>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          disabled={!hasAvailableSlots}
          id="preferred-slot-2"
          onChange={(event) => setPreferredSlot2(event.target.value)}
          value={preferredSlot2}
        >
          <option value="">Select a slot</option>
          {slotOptions.map((slot) => (
            <option disabled={isOptionDisabled(slot.id, 2)} key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="preferred-slot-3">
          Preferred Slot 3 (Optional)
        </label>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
          disabled={!hasAvailableSlots}
          id="preferred-slot-3"
          onChange={(event) => setPreferredSlot3(event.target.value)}
          value={preferredSlot3}
        >
          <option value="">Select a slot</option>
          {slotOptions.map((slot) => (
            <option disabled={isOptionDisabled(slot.id, 3)} key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </div>

      {hasDuplicates ? <p className="text-sm text-red-600">Preferred slots must be unique.</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        type="submit"
        disabled={isSubmitting || !hasAvailableSlots || hasDuplicates}
      >
        {isSubmitting ? "Submitting..." : "Apply"}
      </button>
    </form>
  );
}

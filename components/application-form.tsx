"use client";

import { FormEvent, useState } from "react";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const katakanaPattern = /^[\u30A0-\u30FFー・\s]+$/;

export function ApplicationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [sex, setSex] = useState<"" | "male" | "female">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedBirthday = birthday.trim();
    const normalizedSex = sex.trim();

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

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          email: normalizedEmail,
          birthday: normalizedBirthday,
          sex: normalizedSex
        })
      });

      if (response.ok) {
        setSuccess("Thanks. Please check your inbox and click the verification link.");
        setName("");
        setEmail("");
        setBirthday("");
        setSex("");
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <button
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Apply"}
      </button>
    </form>
  );
}

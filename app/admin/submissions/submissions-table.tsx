"use client";

import type { Gender, Prefecture } from "@prisma/client";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { getGenderLabel } from "@/lib/labels";
import { isValidEmail, isValidPrefecture } from "@/lib/validation";

export type SubmissionTableRow = {
  id: string;
  name: string;
  email: string;
  gender: Gender;
  age: number;
  prefecture: Prefecture;
  birthday: string;
  createdAt: string;
};

type SubmissionFormState = {
  name: string;
  email: string;
  gender: Gender;
  ageText: string;
  prefecture: Prefecture | "";
};

type SubmissionsTableProps = {
  submissions: SubmissionTableRow[];
  genderOptions: Gender[];
  prefectureOptions: Prefecture[];
};

const minSubmissionAge = 18;
const maxSubmissionAge = 100;
const detailFieldClassName =
  "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800";
const textInputClassName =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const selectInputClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";
const primaryButtonClassName =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400";

function formatSubmissionCreatedAt(value: string): string {
  const date = new Date(value);

  const dateText = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const timeText = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${dateText} ${timeText}`;
}

function deriveBirthdayFromAge(
  existingBirthdayIso: string,
  age: number,
): string {
  const today = new Date();
  const existingBirthday = new Date(existingBirthdayIso);
  const nextBirthday = new Date(
    today.getFullYear(),
    existingBirthday.getUTCMonth(),
    existingBirthday.getUTCDate(),
  );

  let birthYear = today.getFullYear() - age;
  if (nextBirthday > today) {
    birthYear -= 1;
  }

  const nextBirthdayMonth = String(existingBirthday.getUTCMonth() + 1).padStart(
    2,
    "0",
  );
  const nextBirthdayDay = String(existingBirthday.getUTCDate()).padStart(
    2,
    "0",
  );

  return `${birthYear}-${nextBirthdayMonth}-${nextBirthdayDay}`;
}

function getInitialFormState(
  submission: SubmissionTableRow,
): SubmissionFormState {
  return {
    name: submission.name,
    email: submission.email,
    gender: submission.gender,
    ageText: String(submission.age),
    prefecture: submission.prefecture,
  };
}

function validateSubmissionForm(values: SubmissionFormState): string | null {
  const name = values.name.trim();
  const email = values.email.trim();
  const ageText = values.ageText.trim();

  if (!name || !email || !values.gender || !values.prefecture) {
    return "必須項目を入力してください。";
  }

  if (!isValidEmail(email)) {
    return "有効なメールアドレスを入力してください。";
  }

  if (!/^\d+$/.test(ageText)) {
    return "年齢は数字のみで入力してください。";
  }

  const age = Number.parseInt(ageText, 10);
  if (
    !Number.isInteger(age) ||
    age < minSubmissionAge ||
    age > maxSubmissionAge
  ) {
    return `年齢は${minSubmissionAge}から${maxSubmissionAge}までの整数で入力してください。`;
  }

  if (!isValidPrefecture(values.prefecture)) {
    return "居住地が不正です。";
  }

  return null;
}

export function SubmissionsTable({
  submissions,
  genderOptions,
  prefectureOptions,
}: SubmissionsTableProps) {
  const [submissionRows, setSubmissionRows] = useState(submissions);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [formValues, setFormValues] = useState<SubmissionFormState | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSubmissionRows(submissions);
  }, [submissions]);

  const selectedSubmission = useMemo(
    () =>
      submissionRows.find(
        (submission) => submission.id === selectedSubmissionId,
      ) ?? null,
    [selectedSubmissionId, submissionRows],
  );

  useEffect(() => {
    if (!selectedSubmission) {
      setFormValues(null);
      setErrorMessage(null);
      return;
    }

    setFormValues(getInitialFormState(selectedSubmission));
    setErrorMessage(null);
  }, [selectedSubmission]);

  useEffect(() => {
    if (!selectedSubmissionId || isSaving || isDeleting) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedSubmissionId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, isSaving, selectedSubmissionId]);

  function openSubmission(submission: SubmissionTableRow) {
    setSelectedSubmissionId(submission.id);
  }

  function closeModal() {
    if (!isSaving && !isDeleting) {
      setSelectedSubmissionId(null);
    }
  }

  function updateFormValue<Key extends keyof SubmissionFormState>(
    key: Key,
    value: SubmissionFormState[Key],
  ) {
    setFormValues((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSubmission || !formValues) {
      return;
    }

    const validationError = validateSubmissionForm(formValues);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const age = Number.parseInt(formValues.ageText, 10);
    const birthday = deriveBirthdayFromAge(selectedSubmission.birthday, age);

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/admin/submissions/${selectedSubmission.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formValues.name.trim(),
            email: formValues.email.trim(),
            gender: formValues.gender,
            birthday,
            prefecture: formValues.prefecture,
          }),
        },
      );

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        submission?: SubmissionTableRow;
      } | null;

      if (!response.ok || !payload?.submission) {
        setErrorMessage(payload?.error ?? "申込を更新できませんでした。");
        return;
      }

      setSubmissionRows((current) =>
        current.map((submission) =>
          submission.id === payload.submission?.id
            ? payload.submission
            : submission,
        ),
      );
      setSelectedSubmissionId(null);
    } catch {
      setErrorMessage("申込を更新できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  async function onDelete() {
    if (!selectedSubmission) {
      return;
    }

    const confirmed = window.confirm(
      "この申込を削除しますか？\n応募データが紐づいている申込は削除できません。"
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/submissions/${selectedSubmission.id}`,
        {
          method: "DELETE",
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; submissionId?: string }
        | null;

      if (!response.ok || payload?.submissionId !== selectedSubmission.id) {
        setErrorMessage(payload?.error ?? "申込を削除できませんでした。");
        return;
      }

      setSubmissionRows((current) =>
        current.filter((submission) => submission.id !== payload.submissionId),
      );
      setSelectedSubmissionId(null);
    } catch {
      setErrorMessage("申込を削除できませんでした。");
    } finally {
      setIsDeleting(false);
    }
  }

  const isSubmitting = isSaving || isDeleting;

  return (
    <>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="px-2 py-2">名前</th>
              <th className="px-2 py-2">メイル</th>
              <th className="px-2 py-2">性別</th>
              <th className="px-2 py-2">年齢</th>
              <th className="px-2 py-2">居住地</th>
              <th className="px-2 py-2">申込日時</th>
            </tr>
          </thead>
          <tbody>
            {submissionRows.map((submission) => (
              <tr
                aria-label={`${submission.name} の詳細を表示`}
                className="cursor-pointer border-b border-slate-100 align-top outline-none transition hover:bg-slate-50 focus:bg-slate-50"
                key={submission.id}
                onClick={() => openSubmission(submission)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSubmission(submission);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <td className="px-2 py-3">{submission.name}</td>
                <td className="px-2 py-3">{submission.email}</td>
                <td className="px-2 py-3">
                  {getGenderLabel(submission.gender)}
                </td>
                <td className="px-2 py-3">{submission.age}</td>
                <td className="px-2 py-3">{submission.prefecture}</td>
                <td className="px-2 py-3">
                  {formatSubmissionCreatedAt(submission.createdAt)}
                </td>
              </tr>
            ))}
            {submissionRows.length === 0 ? (
              <tr>
                <td className="px-2 py-4 text-slate-500" colSpan={6}>
                  申込はありません
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedSubmission && formValues ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={closeModal}
          role="dialog"
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  申込編集
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedSubmission.name}
                </p>
              </div>
              <button
                className={secondaryButtonClassName}
                disabled={isSubmitting}
                onClick={closeModal}
                type="button"
              >
                閉じる
              </button>
            </div>

            <form className="space-y-5 px-6 py-5" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-slate-600"
                    htmlFor="submission-name"
                  >
                    名前
                  </label>
                  <input
                    className={textInputClassName}
                    id="submission-name"
                    onChange={(event) =>
                      updateFormValue("name", event.target.value)
                    }
                    type="text"
                    value={formValues.name}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-slate-600"
                    htmlFor="submission-email"
                  >
                    メイル
                  </label>
                  <input
                    className={textInputClassName}
                    id="submission-email"
                    onChange={(event) =>
                      updateFormValue("email", event.target.value)
                    }
                    type="text"
                    value={formValues.email}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-slate-600"
                    htmlFor="submission-gender"
                  >
                    性別
                  </label>
                  <select
                    className={selectInputClassName}
                    id="submission-gender"
                    onChange={(event) =>
                      updateFormValue("gender", event.target.value as Gender)
                    }
                    value={formValues.gender}
                  >
                    {genderOptions.map((gender) => (
                      <option key={gender} value={gender}>
                        {getGenderLabel(gender)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-slate-600"
                    htmlFor="submission-age"
                  >
                    年齢
                  </label>
                  <input
                    className={textInputClassName}
                    id="submission-age"
                    inputMode="numeric"
                    onChange={(event) =>
                      updateFormValue(
                        "ageText",
                        event.target.value.replace(/\D/g, ""),
                      )
                    }
                    type="text"
                    value={formValues.ageText}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-slate-600"
                    htmlFor="submission-prefecture"
                  >
                    居住地
                  </label>
                  <select
                    className={selectInputClassName}
                    id="submission-prefecture"
                    onChange={(event) =>
                      updateFormValue(
                        "prefecture",
                        event.target.value as SubmissionFormState["prefecture"],
                      )
                    }
                    value={formValues.prefecture}
                  >
                    <option value="">居住地を選択</option>
                    {prefectureOptions.map((prefecture) => (
                      <option key={prefecture} value={prefecture}>
                        {prefecture}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-slate-600">
                    申込日時
                  </p>
                  <div className={detailFieldClassName}>
                    {formatSubmissionCreatedAt(selectedSubmission.createdAt)}
                  </div>
                </div>
              </div>

              {errorMessage ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <div>
                  <button
                    className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-50 disabled:text-rose-300"
                    disabled={isSubmitting}
                    onClick={onDelete}
                    type="button"
                  >
                    {isDeleting ? "削除中..." : "削除"}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    className={secondaryButtonClassName}
                    disabled={isSubmitting}
                    onClick={closeModal}
                    type="button"
                  >
                    キャンセル
                  </button>
                  <button
                    className={primaryButtonClassName}
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSaving ? "保存中..." : "保存"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

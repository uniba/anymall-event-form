"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { prefectureOptions } from "@/lib/labels";
import { getMemoMaxLength } from "@/lib/validation";
import { Icon } from "@/components/icon";
import { formatMonthDay } from "@/lib/format-date";

type SlotData = {
  id: string;
  eventName: string;
  startsAt: string;
  endsAt: string;
  venue: { name: string; address: string };
  instructor: string;
};

type GenderValue = "" | "male" | "female" | "unspecified";

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "unspecified", label: "回答しない" },
];

const genderDisplayLabel: Record<string, string> = {
  male: "男性",
  female: "女性",
  unspecified: "回答しない",
};

type FormData = {
  name: string;
  furigana: string;
  email: string;
  birthdayYear: string;
  birthdayMonth: string;
  birthdayDay: string;
  gender: GenderValue;
  prefecture: string;
  memo: string;
};

type Step = "form" | "confirm" | "complete";

const STEPS = [
  { key: "form", label: "入力" },
  { key: "confirm", label: "確認" },
  { key: "complete", label: "完了" },
] as const;

const inputClass =
  "w-full rounded-lg border border-warm-400 bg-white px-3.5 py-2.5 text-[16px] text-warm-900 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-1";

const selectClass =
  "w-full appearance-none rounded-lg border border-warm-400 bg-white py-2.5 pl-3.5 pr-9 text-[16px] text-warm-900 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-1";

const YEAR_OPTIONS = Array.from(
  { length: 2026 - 1900 + 1 },
  (_, i) => 1900 + i,
);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

function formatBirthday(year: string, month: string, day: string): string {
  if (!year && !month && !day) return "";
  const parts: string[] = [];
  if (year) parts.push(`${year}年`);
  if (month) parts.push(`${month}月`);
  if (day) parts.push(`${day}日`);
  return parts.join("");
}

function toBirthdayISO(year: string, month: string, day: string): string {
  if (!year || !month || !day) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-0 px-4 py-5">
      {STEPS.map((s, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={s.key} className="flex">
            {i > 0 && (
              <div
                className={`relative top-[14px] h-px w-10 ${i <= currentIndex ? "bg-brand-green" : "bg-warm-300"
                  }`}
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${isCompleted || isCurrent
                  ? "bg-brand-green text-white"
                  : "bg-warm-300 text-warm-500"
                  }`}
              >
                {isCompleted ? (
                  <Icon className="text-white" name="Check" size={14} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[11px] font-medium ${isCompleted || isCurrent
                  ? "text-brand-green"
                  : "text-warm-400"
                  }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] text-warm-500">
        {label}
        {required ? " * 必須" : " 任意"}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-warm-200 pb-3">
      <span className="text-[11px] text-warm-500">{label}</span>
      <span className="text-sm text-warm-900">{value || "—"}</span>
    </div>
  );
}

function SlotSummaryCard({ slot }: { slot: SlotData }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-warm-400 bg-white p-3">
      <h4 className="text-ms font-bold text-warm-900">{slot.eventName}</h4>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px]">
          <div className="text-warm-500 min-w-13">担当者</div>
          <div className="flex items-center gap-2">
            <figure
              className="size-10 rounded-full border border-warm-200 bg-gray-300 -ml-[2px]"
              data-instructor={slot.instructor}
            ></figure>
            <span className="text-warm-900">{slot.instructor}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <div className="text-warm-500 min-w-13">会場</div>
          <span className="text-warm-900">{slot.venue.name}</span>
        </div>
      </div>
    </div>
  );
}

// --------------- Terms Modal ---------------

function TermsModal({ onClose }: { onClose: () => void }) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-warm-200 px-5 py-4">
          <h3 className="text-base font-bold text-warm-900">利用規約</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-warm-500 transition-colors hover:bg-warm-100"
          >
            <Icon name="X" size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-[13px] leading-6 text-warm-900">
          <h4 className="mb-2 font-bold">第1条（適用）</h4>
          <p className="mb-4">
            本規約は、AnyMall（以下「当社」）が提供するイベント参加申し込みサービス（以下「本サービス」）の利用に関する条件を定めるものです。利用者は本規約に同意の上、本サービスを利用するものとします。
          </p>
          <h4 className="mb-2 font-bold">第2条（個人情報の取扱い）</h4>
          <p className="mb-4">
            当社は、本サービスの提供にあたり取得した個人情報を、イベントの運営・管理、抽選結果の通知、およびサービス向上の目的にのみ使用します。法令に定める場合を除き、利用者の同意なく第三者に提供することはありません。
          </p>
          <h4 className="mb-2 font-bold">第3条（申し込みと抽選）</h4>
          <p className="mb-4">
            イベントへの参加は申し込み制とし、応募者多数の場合は抽選により参加者を決定します。抽選結果はメールにてお知らせいたします。抽選結果に関するお問い合わせにはお答えできません。
          </p>
          <h4 className="mb-2 font-bold">第4条（キャンセル）</h4>
          <p className="mb-4">
            参加確定後のキャンセルは、イベント開催日の3日前までにメールにてご連絡ください。無断キャンセルが続く場合、今後のイベント参加をお断りする場合があります。
          </p>
          <h4 className="mb-2 font-bold">第5条（免責事項）</h4>
          <p className="mb-4">
            当社は、天災・その他やむを得ない事由によりイベントが中止または変更となった場合の損害について、一切の責任を負いません。
          </p>
          <h4 className="mb-2 font-bold">第6条（規約の変更）</h4>
          <p>
            当社は、必要に応じて本規約を変更することがあります。変更後の規約は、本サービス上での掲示をもって効力を生じるものとします。
          </p>
        </div>
        <div className="border-t border-warm-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-full items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white transition-colors hover:bg-brand-green-dark"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------- Step components ---------------

function FormStep({
  formData,
  setFormData,
  error,
  onBack,
  onConfirm,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const memoMaxLength = getMemoMaxLength();
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string>>
  >({});

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const katakanaPattern = /^[\u30A0-\u30FFー・\s]+$/;

  function validateFields(): Partial<Record<string, string>> {
    const errors: Partial<Record<string, string>> = {};
    if (!formData.name.trim()) {
      errors.name = "氏名を入力してください";
    }
    if (!formData.furigana.trim()) {
      errors.furigana = "フリガナを入力してください";
    } else if (!katakanaPattern.test(formData.furigana.trim())) {
      errors.furigana = "フリガナはカタカナで入力してください";
    }
    if (!formData.email.trim()) {
      errors.email = "メールアドレスを入力してください";
    } else if (!emailPattern.test(formData.email.trim())) {
      errors.email = "有効なメールアドレスを入力してください";
    }
    return errors;
  }

  function handleSubmitClick() {
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onConfirm();
  }

  function update(field: keyof FormData, value: string) {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-3.5 pt-6">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5 px-4 md:px-0">
        <div className="grid gap-3.5 md:grid-cols-2">
          <FormField label="氏名" required error={fieldErrors.name}>
            <input
              type="text"
              className={inputClass}
              placeholder="山内 あい"
              value={formData.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </FormField>

          <FormField
            label="氏名（フリガナ）"
            required
            error={fieldErrors.furigana}
          >
            <input
              type="text"
              className={inputClass}
              placeholder="ヤマウチ アイ"
              value={formData.furigana}
              onChange={(e) => update("furigana", e.target.value)}
            />
          </FormField>
        </div>

        <FormField label="メールアドレス" required error={fieldErrors.email}>
          <input
            type="email"
            className={inputClass}
            placeholder="ai_yamauchi@example.com"
            value={formData.email}
            onChange={(e) => update("email", e.target.value)}
          />
        </FormField>

        <FormField label="生年月日">
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <select
                className={selectClass}
                value={formData.birthdayYear}
                onChange={(e) => update("birthdayYear", e.target.value)}
                onFocus={(e) => {
                  if (!formData.birthdayYear) {
                    const opt =
                      e.currentTarget.querySelector<HTMLOptionElement>(
                        'option[value="1995"]',
                      );
                    if (opt) opt.selected = true;
                  }
                }}
                onBlur={(e) => {
                  if (!formData.birthdayYear) {
                    e.currentTarget.value = "";
                  }
                }}
              >
                <option value="">年</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
              <Icon
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-warm-500"
                name="ChevronDown"
                size={14}
              />
            </div>
            <div className="relative">
              <select
                className={selectClass}
                value={formData.birthdayMonth}
                onChange={(e) => update("birthdayMonth", e.target.value)}
              >
                <option value="">月</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m} value={String(m)}>
                    {m}月
                  </option>
                ))}
              </select>
              <Icon
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-warm-500"
                name="ChevronDown"
                size={14}
              />
            </div>
            <div className="relative">
              <select
                className={selectClass}
                value={formData.birthdayDay}
                onChange={(e) => update("birthdayDay", e.target.value)}
              >
                <option value="">日</option>
                {DAY_OPTIONS.map((d) => (
                  <option key={d} value={String(d)}>
                    {d}日
                  </option>
                ))}
              </select>
              <Icon
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-warm-500"
                name="ChevronDown"
                size={14}
              />
            </div>
          </div>
        </FormField>

        <FormField label="居住地">
          <div className="relative">
            <select
              className={selectClass}
              value={formData.prefecture}
              onChange={(e) => update("prefecture", e.target.value)}
            >
              <option value="">選択してください</option>
              {prefectureOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <Icon
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-warm-500"
              name="ChevronDown"
              size={16}
            />
          </div>
        </FormField>

        <FormField label="性別">
          <div className="grid grid-cols-3 gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("gender", opt.value)}
                className={`flex h-10 items-center justify-center rounded-lg border text-[13px] font-medium transition-colors ${formData.gender === opt.value
                  ? "border-brand-green bg-brand-green-bg text-brand-green-accent"
                  : "border-warm-400 bg-white text-warm-900 hover:bg-warm-50"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="ペットに​ついて​">
          <textarea
            className="min-h-[115px] w-full rounded-lg border border-warm-400 bg-white px-3.5 py-2.5 text-[16px] text-warm-900 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-1"
            placeholder="犬種・猫種・年齢・興味・関心・困りごとなど、飼っている​ペットに​ついて​教えてください。"
            maxLength={memoMaxLength}
            value={formData.memo}
            onChange={(e) => update("memo", e.target.value)}
          />
          <p className="text-right text-[11px] text-warm-500">
            {formData.memo.length}/{memoMaxLength}
          </p>
        </FormField>

        <div className="flex flex-col gap-3 pb-2">
          <div className="rounded-lg border border-warm-300 bg-warm-50 p-4">
            <p className="text-[13px] leading-6 text-warm-600">
              ご入力いただいた個人情報は、本イベントの申込受付、抽選、当落連絡、本人確認、当日の運営、お問い合わせ対応のために利用します。
              <br />
              また、当社および本イベントの協賛企業・提携先が、今後のイベント、商品、サービス、キャンペーン等のご案内のために利用し、必要な範囲で共有する場合があります。
              詳細は、
              <a
                className="font-bold text-brand-green underline underline-offset-2"
                href="https://www.anymall.jp/meal/ja/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                プライバシーポリシー
              </a>
              をご確認ください。
            </p>
          </div>

          <label
            htmlFor="terms-agree"
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-warm-300 bg-white p-4 transition-colors hover:bg-warm-50 active:bg-warm-100"
          >
            <input
              type="checkbox"
              id="terms-agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-green"
            />
            <span className="text-[15px] leading-6 text-warm-900">
              上記内容および
              <a
                className="font-bold text-brand-green underline underline-offset-2"
                href="https://www.anymall.jp/meal/ja/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                プライバシーポリシー
              </a>
              に同意
            </span>
          </label>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 bg-white py-4 mt-auto">
        <button
          type="button"
          onClick={onBack}
          className="flex h-11 w-[140px] items-center justify-center rounded-full border border-warm-200 bg-white text-sm font-bold text-warm-500 transition-colors hover:bg-warm-50"
        >
          戻る
        </button>
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={!agreed}
          className="flex h-11 w-[140px] items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white transition-colors hover:bg-brand-green-dark disabled:opacity-40"
        >
          送信する
        </button>
      </div>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}

function ConfirmStep({
  formData,
  slots,
  isSubmitting,
  error,
  onBack,
  onSubmit,
}: {
  formData: FormData;
  slots: SlotData[];
  isSubmitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 gap-3.5 pt-6">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-3.5 px-4 md:px-0">
        <div>
          <h2 className="text-lg font-bold text-warm-900">入力内容の確認</h2>
          <p className="mt-1 text-sm text-warm-500">
            以下の内容でよろしければ応募してください
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <ConfirmRow label="氏名" value={formData.name} />
          <ConfirmRow label="氏名（フリガナ）" value={formData.furigana} />
          <ConfirmRow label="メールアドレス" value={formData.email} />
          <ConfirmRow
            label="生年月日"
            value={formatBirthday(
              formData.birthdayYear,
              formData.birthdayMonth,
              formData.birthdayDay,
            )}
          />
          <ConfirmRow label="居住地" value={formData.prefecture} />
          <ConfirmRow
            label="性別"
            value={formData.gender ? genderDisplayLabel[formData.gender] : ""}
          />
          <ConfirmRow label="ペットに​ついて​" value={formData.memo} />
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[11px] text-warm-500">申し込みイベント</span>
          {slots.map((slot) => (
            <SlotSummaryCard key={slot.id} slot={slot} />
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex items-center justify-center gap-4 bg-white py-4 mt-auto">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex h-11 w-[140px] items-center justify-center rounded-full border border-warm-200 bg-white text-sm font-bold text-warm-500 transition-colors hover:bg-warm-50"
        >
          修正する
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand-green px-6 text-sm font-bold text-white transition-colors hover:bg-brand-green-dark disabled:opacity-60"
        >
          {isSubmitting ? "送信中..." : "この内容で送信"}
        </button>
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-16 md:px-0">
      <div className="flex w-[90%] items-center justify-center">
        <Image
          className="rounded-[36px]"
          src="/images/fig-family.jpg"
          alt=""
          width={512}
          height={512}
        />
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-2xl font-bold text-warm-900">
          お申し込み​ありがとう​ございます
        </h2>
        <p className="text-sm leading-6 text-warm-500">
          お申し込み控え​メールを​送信しましたので​ご確認ください。
          <br />
          万一メールが​届いていない​場合は、​お問い​合わせください。
          <br />
          抽選結果は​後日メールにてお知らせします。
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-3 pt-4">
        <a
          href="/"
          className="flex h-11 w-full items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white transition-colors hover:bg-brand-green-dark"
        >
          戻る
        </a>
        <a
          href="https://www.anymall.jp/meal/ja/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-full items-center justify-center rounded-full border border-warm-200 bg-white text-sm font-bold text-warm-500 transition-colors hover:bg-warm-50"
        >
          お問い合わせ
        </a>
      </div>
    </div>
  );
}

// --------------- Main component ---------------

export function ApplyForm({ slots }: { slots: SlotData[] }) {
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    furigana: "",
    email: "",
    birthdayYear: "",
    birthdayMonth: "",
    birthdayDay: "",
    gender: "",
    prefecture: "",
    memo: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleConfirm() {
    setError(null);
    setStep("confirm");
    window.scrollTo(0, 0);
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          furigana: formData.furigana.trim(),
          email: formData.email.trim().toLowerCase(),
          birthday:
            toBirthdayISO(
              formData.birthdayYear,
              formData.birthdayMonth,
              formData.birthdayDay,
            ) || "",
          gender: formData.gender || "",
          prefecture: formData.prefecture.trim(),
          memo: formData.memo.trim(),
          selectedSlotIds: slots.map((s) => s.id),
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (response.ok) {
        setStep("complete");
        window.scrollTo(0, 0);
        return;
      }

      setError(data?.error ?? "送信に失敗しました。もう一度お試しください。");
    } catch {
      setError("送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {step != "complete" && (
        <div className="mx-auto max-w-6xl px-4 pb-2 pt-6 text-center md:py-8">
          <h1 className="text-[28px] font-bold text-warm-900">
            イベント参加申し込み
          </h1>
          <p className="mt-2 text-sm text-warm-500">
            以下の​項目に​ついて​それぞれご記入ください。
          </p>
        </div>
      )}
      {step === "complete" && <CompleteStep />}
      {step === "confirm" && (
        <ConfirmStep
          formData={formData}
          slots={slots}
          isSubmitting={isSubmitting}
          error={error}
          onBack={() => {
            setError(null);
            setStep("form");
            window.scrollTo(0, 0);
          }}
          onSubmit={handleSubmit}
        />
      )}
      {step === "form" && (
        <FormStep
          formData={formData}
          setFormData={setFormData}
          error={error}
          onBack={() => window.history.back()}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}

"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { getSlotStateLabel } from "@/lib/labels";
import {
  combineAdminSlotDateAndTime,
  formatAdminSlotDate,
  formatAdminSlotDateTimeRange,
  formatAdminSlotTime,
  getAdminSlotDateInputValue,
  getAdminSlotTimeInputValue,
} from "@/lib/slot-display";

export type SlotTableRow = {
  id: string;
  eventName: string;
  venueId: string;
  venueName: string;
  theme: string;
  instructor: string;
  capacity: number;
  applicationBegin: string;
  applicationDeadline: string;
  lotteryResultTime: string;
  startsAt: string;
  endsAt: string;
  state: "APPLICATIONS_CLOSED" | "ACCEPTING_APPLICATIONS";
};

type SlotFormState = {
  eventName: string;
  venueId: string;
  theme: string;
  instructor: string;
  capacityText: string;
  applicationBeginDate: string;
  applicationBeginTime: string;
  applicationDeadlineDate: string;
  applicationDeadlineTime: string;
  lotteryResultDate: string;
  lotteryResultTime: string;
  eventDate: string;
  startsAtTime: string;
  endsAtTime: string;
  state: SlotTableRow["state"];
};

type VenueOption = {
  id: string;
  name: string;
};

type SlotsTableProps = {
  createRequestCount?: number;
  onSlotCreated?: () => void;
  slots: SlotTableRow[];
};

const slotStateOptions: Array<SlotTableRow["state"]> = [
  "APPLICATIONS_CLOSED",
  "ACCEPTING_APPLICATIONS",
];
const slotThemeMaxLength = 150;
const slotCapacityMax = 100;
const textInputClassName =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const selectInputClassName =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500";
const primaryButtonClassName =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400";
const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

const emptySlotFormState: SlotFormState = {
  eventName: "",
  venueId: "",
  theme: "",
  instructor: "",
  capacityText: "",
  applicationBeginDate: "",
  applicationBeginTime: "",
  applicationDeadlineDate: "",
  applicationDeadlineTime: "",
  lotteryResultDate: "",
  lotteryResultTime: "",
  eventDate: "",
  startsAtTime: "",
  endsAtTime: "",
  state: "ACCEPTING_APPLICATIONS"
};

type ModalState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      slotId: string;
    };

function getInitialFormState(slot: SlotTableRow): SlotFormState {
  return {
    eventName: slot.eventName,
    venueId: slot.venueId,
    theme: slot.theme,
    instructor: slot.instructor,
    capacityText: String(slot.capacity),
    applicationBeginDate: getAdminSlotDateInputValue(slot.applicationBegin),
    applicationBeginTime: getAdminSlotTimeInputValue(slot.applicationBegin),
    applicationDeadlineDate: getAdminSlotDateInputValue(
      slot.applicationDeadline,
    ),
    applicationDeadlineTime: getAdminSlotTimeInputValue(
      slot.applicationDeadline,
    ),
    lotteryResultDate: getAdminSlotDateInputValue(slot.lotteryResultTime),
    lotteryResultTime: getAdminSlotTimeInputValue(slot.lotteryResultTime),
    eventDate: getAdminSlotDateInputValue(slot.startsAt),
    startsAtTime: getAdminSlotTimeInputValue(slot.startsAt),
    endsAtTime: getAdminSlotTimeInputValue(slot.endsAt),
    state: slot.state,
  };
}

function buildSlotUpdatePayload(values: SlotFormState): {
  error?: string;
  payload?: Record<string, unknown>;
} {
  const eventName = values.eventName.trim();
  const venueId = values.venueId.trim();
  const theme = values.theme.trim();
  const instructor = values.instructor.trim();
  const capacityText = values.capacityText.trim();

  if (
    !eventName ||
    !venueId ||
    !theme ||
    !instructor ||
    !values.applicationBeginDate ||
    !values.applicationBeginTime ||
    !values.applicationDeadlineDate ||
    !values.applicationDeadlineTime ||
    !values.lotteryResultDate ||
    !values.lotteryResultTime ||
    !values.eventDate ||
    !values.startsAtTime ||
    !values.endsAtTime ||
    !values.state
  ) {
    return { error: "必須項目を入力してください。" };
  }

  if (theme.length > slotThemeMaxLength) {
    return {
      error: `テーマは${slotThemeMaxLength}文字以内で入力してください。`,
    };
  }

  if (!/^\d+$/.test(capacityText)) {
    return { error: "定員は数字のみで入力してください。" };
  }

  const capacity = Number.parseInt(capacityText, 10);
  if (
    !Number.isInteger(capacity) ||
    capacity < 0 ||
    capacity > slotCapacityMax
  ) {
    return {
      error: `定員は0から${slotCapacityMax}までの整数で入力してください。`,
    };
  }

  const applicationBegin = combineAdminSlotDateAndTime(
    values.applicationBeginDate,
    values.applicationBeginTime,
  );
  const applicationDeadline = combineAdminSlotDateAndTime(
    values.applicationDeadlineDate,
    values.applicationDeadlineTime,
  );
  const lotteryResultTime = combineAdminSlotDateAndTime(
    values.lotteryResultDate,
    values.lotteryResultTime,
  );
  const startsAt = combineAdminSlotDateAndTime(
    values.eventDate,
    values.startsAtTime,
  );
  const endsAt = combineAdminSlotDateAndTime(
    values.eventDate,
    values.endsAtTime,
  );

  if (
    new Date(applicationBegin).getTime() >
    new Date(applicationDeadline).getTime()
  ) {
    return { error: "応募開始日時は応募締切日時以前にしてください。" };
  }

  if (values.lotteryResultDate >= values.eventDate) {
    return { error: "抽選日は開催日より前にしてください。" };
  }

  if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
    return { error: "開催終了時間は開催開始時間より後にしてください。" };
  }

  if (
    getAdminSlotDateInputValue(startsAt) !== values.eventDate ||
    getAdminSlotDateInputValue(endsAt) !== values.eventDate
  ) {
    return { error: "開催日時は同じ日付内で入力してください。" };
  }

  return {
    payload: {
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
      state: values.state,
    },
  };
}

export function SlotsTable({
  createRequestCount = 0,
  onSlotCreated,
  slots
}: SlotsTableProps) {
  const [slotRows, setSlotRows] = useState(slots);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [formValues, setFormValues] = useState<SlotFormState | null>(null);
  const [venues, setVenues] = useState<VenueOption[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setSlotRows(slots);
  }, [slots]);

  const selectedSlot = useMemo(
    () => (modalState?.mode === "edit" ? slotRows.find((slot) => slot.id === modalState.slotId) ?? null : null),
    [modalState, slotRows],
  );

  useEffect(() => {
    if (!modalState) {
      setFormValues(null);
      setErrorMessage(null);
      return;
    }

    if (modalState.mode === "create") {
      setFormValues(emptySlotFormState);
      setErrorMessage(null);
      return;
    }

    if (!selectedSlot) {
      setModalState(null);
      return;
    }

    setFormValues(getInitialFormState(selectedSlot));
    setErrorMessage(null);
  }, [modalState, selectedSlot]);

  useEffect(() => {
    if (!modalState) {
      return;
    }

    let isCancelled = false;

    async function loadVenues() {
      setIsLoadingVenues(true);

      try {
        const response = await fetch("/api/admin/venues");
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          venues?: VenueOption[];
        } | null;

        if (!response.ok || !payload?.venues) {
          if (!isCancelled) {
            setErrorMessage(
              payload?.error ?? "会場一覧を取得できませんでした。",
            );
          }
          return;
        }

        if (!isCancelled) {
          setVenues(payload.venues);
        }
      } catch {
        if (!isCancelled) {
          setErrorMessage("会場一覧を取得できませんでした。");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingVenues(false);
        }
      }
    }

    void loadVenues();

    return () => {
      isCancelled = true;
    };
  }, [modalState]);

  useEffect(() => {
    if (createRequestCount < 1) {
      return;
    }

    setModalState({ mode: "create" });
  }, [createRequestCount]);

  useEffect(() => {
    if (!modalState || isSaving || isDeleting) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModalState(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, isSaving, modalState]);

  function updateFormValue<Key extends keyof SlotFormState>(
    key: Key,
    value: SlotFormState[Key],
  ) {
    setFormValues((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  function closeModal() {
    if (!isSaving && !isDeleting) {
      setModalState(null);
    }
  }

  function openSlot(slot: SlotTableRow) {
    setModalState({ mode: "edit", slotId: slot.id });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!modalState || !formValues) {
      return;
    }

    const submission = buildSlotUpdatePayload(formValues);
    if (!submission.payload) {
      setErrorMessage(submission.error ?? "入力内容を確認してください。");
      return;
    }

    if (venues.length === 0) {
      setErrorMessage("会場一覧の読み込み完了後に保存してください。");
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const isCreateMode = modalState.mode === "create";
      const response = await fetch(isCreateMode ? "/api/admin/slots" : `/api/admin/slots/${modalState.slotId}`, {
        method: isCreateMode ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submission.payload),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        slot?: SlotTableRow;
      } | null;
      const slot = payload?.slot;

      if (!response.ok || !slot) {
        setErrorMessage(payload?.error ?? (isCreateMode ? "スロットを追加できませんでした。" : "スロットを更新できませんでした。"));
        return;
      }

      if (isCreateMode) {
        setSlotRows((current) => [...current, slot].sort((left, right) => left.startsAt.localeCompare(right.startsAt)));
        setModalState(null);
        onSlotCreated?.();
      } else {
        setSlotRows((current) =>
          current.map((currentSlot) =>
            currentSlot.id === slot.id ? slot : currentSlot,
          ),
        );
        setModalState(null);
      }
    } catch {
      setErrorMessage(modalState.mode === "create" ? "スロットを追加できませんでした。" : "スロットを更新できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  async function onDelete() {
    if (modalState?.mode !== "edit" || !selectedSlot) {
      return;
    }

    const confirmed = window.confirm(
      "このスロットを削除しますか？\n応募データが紐づいているスロットは削除できません。"
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/slots/${modalState.slotId}`, {
        method: "DELETE"
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; slotId?: string }
        | null;

      if (!response.ok || payload?.slotId !== modalState.slotId) {
        setErrorMessage(payload?.error ?? "スロットを削除できませんでした。");
        return;
      }

      setSlotRows((current) => current.filter((slot) => slot.id !== payload.slotId));
      setModalState(null);
    } catch {
      setErrorMessage("スロットを削除できませんでした。");
    } finally {
      setIsDeleting(false);
    }
  }

  const isCreateMode = modalState?.mode === "create";
  const modalTitle = isCreateMode ? "スロット追加" : "スロット編集";
  const modalSubtitle = isCreateMode ? "新しいスロット情報を入力してください" : selectedSlot?.eventName ?? "";
  const isSubmitting = isSaving || isDeleting;
  const submitLabel = isSaving ? "保存中..." : isCreateMode ? "追加" : "保存";

  return (
    <>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="px-2 py-2">開催日時</th>
              <th className="px-2 py-2">イベント名</th>
              <th className="px-2 py-2">会場</th>
              <th className="px-2 py-2">状態</th>
            </tr>
          </thead>
          <tbody>
            {slotRows.map((slot) => (
              <tr
                aria-label={`${slot.eventName} の詳細を表示`}
                className="cursor-pointer border-b border-slate-100 align-top outline-none transition hover:bg-slate-50 focus:bg-slate-50"
                key={slot.id}
                onClick={() => openSlot(slot)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSlot(slot);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <td className="px-2 py-3">
                  {formatAdminSlotDate(slot.startsAt)}
                </td>
                <td className="px-2 py-3">{slot.eventName}</td>
                <td className="px-2 py-3">{slot.venueName}</td>
                <td className="px-2 py-3">{getSlotStateLabel(slot.state)}</td>
              </tr>
            ))}
            {slotRows.length === 0 ? (
              <tr>
                <td className="px-2 py-4 text-slate-500" colSpan={4}>
                  スロットはありません
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {modalState && formValues ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={closeModal}
          role="dialog"
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {modalTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {modalSubtitle}
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
                    htmlFor="slot-event-name"
                  >
                    イベント名
                  </label>
                  <input
                    className={textInputClassName}
                    id="slot-event-name"
                    onChange={(event) =>
                      updateFormValue("eventName", event.target.value)
                    }
                    type="text"
                    value={formValues.eventName}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-slate-600"
                    htmlFor="slot-venue"
                  >
                    会場
                  </label>
                  <select
                    className={selectInputClassName}
                    disabled={isLoadingVenues || isSubmitting}
                    id="slot-venue"
                    onChange={(event) =>
                      updateFormValue("venueId", event.target.value)
                    }
                    value={formValues.venueId}
                  >
                    <option value="">
                      {isLoadingVenues
                        ? "会場を読み込み中..."
                        : venues.length > 0
                          ? "会場を選択"
                          : "会場なし"}
                    </option>
                    {venues.map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
                    <label htmlFor="slot-theme">テーマ</label>
                    <span>
                      {formValues.theme.length}/{slotThemeMaxLength}
                    </span>
                  </div>
                  <textarea
                    className={`${textInputClassName} min-h-32`}
                    id="slot-theme"
                    maxLength={slotThemeMaxLength}
                    onChange={(event) =>
                      updateFormValue("theme", event.target.value)
                    }
                    value={formValues.theme}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-slate-600"
                    htmlFor="slot-instructor"
                  >
                    インストラクター
                  </label>
                  <input
                    className={textInputClassName}
                    id="slot-instructor"
                    onChange={(event) =>
                      updateFormValue("instructor", event.target.value)
                    }
                    type="text"
                    value={formValues.instructor}
                  />
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-slate-600"
                    htmlFor="slot-capacity"
                  >
                    定員
                  </label>
                  <input
                    className={textInputClassName}
                    id="slot-capacity"
                    inputMode="numeric"
                    onChange={(event) =>
                      updateFormValue(
                        "capacityText",
                        event.target.value.replace(/\D/g, ""),
                      )
                    }
                    type="text"
                    value={formValues.capacityText}
                  />
                </div>

                <div>
                  <p className="mb-1 block text-xs font-medium text-slate-600">
                    応募開始日時
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className={textInputClassName}
                      onChange={(event) =>
                        updateFormValue(
                          "applicationBeginDate",
                          event.target.value,
                        )
                      }
                      type="date"
                      value={formValues.applicationBeginDate}
                    />
                    <select
                      className={selectInputClassName}
                      onChange={(event) =>
                        updateFormValue(
                          "applicationBeginTime",
                          event.target.value,
                        )
                      }
                      value={formValues.applicationBeginTime}
                    >
                      <option value="">応募開始時間を選ぶ</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="mb-1 block text-xs font-medium text-slate-600">
                    応募締切日時
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className={textInputClassName}
                      onChange={(event) =>
                        updateFormValue(
                          "applicationDeadlineDate",
                          event.target.value,
                        )
                      }
                      type="date"
                      value={formValues.applicationDeadlineDate}
                    />
                    <select
                      className={selectInputClassName}
                      onChange={(event) =>
                        updateFormValue(
                          "applicationDeadlineTime",
                          event.target.value,
                        )
                      }
                      value={formValues.applicationDeadlineTime}
                    >
                      <option value="">応募締切時間を選ぶ</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="mb-1 block text-xs font-medium text-slate-600">
                    抽選結果日時
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className={textInputClassName}
                      onChange={(event) =>
                        updateFormValue("lotteryResultDate", event.target.value)
                      }
                      type="date"
                      value={formValues.lotteryResultDate}
                    />
                    <select
                      className={selectInputClassName}
                      onChange={(event) =>
                        updateFormValue("lotteryResultTime", event.target.value)
                      }
                      value={formValues.lotteryResultTime}
                    >
                      <option value="">時間を選択</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <p className="mb-1 block text-xs font-medium text-slate-600">
                    開催日時
                  </p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      className={textInputClassName}
                      onChange={(event) =>
                        updateFormValue("eventDate", event.target.value)
                      }
                      type="date"
                      value={formValues.eventDate}
                    />
                    <select
                      className={selectInputClassName}
                      onChange={(event) =>
                        updateFormValue("startsAtTime", event.target.value)
                      }
                      value={formValues.startsAtTime}
                    >
                      <option value="">開始時間を選択</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <select
                      className={selectInputClassName}
                      onChange={(event) =>
                        updateFormValue("endsAtTime", event.target.value)
                      }
                      value={formValues.endsAtTime}
                    >
                      <option value="">終了時間を選択</option>
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    className="mb-1 block text-xs font-medium text-slate-600"
                    htmlFor="slot-state"
                  >
                    状態
                  </label>
                  <select
                    className={selectInputClassName}
                    id="slot-state"
                    onChange={(event) =>
                      updateFormValue(
                        "state",
                        event.target.value as SlotTableRow["state"],
                      )
                    }
                    value={formValues.state}
                  >
                    {slotStateOptions.map((state) => (
                      <option key={state} value={state}>
                        {getSlotStateLabel(state)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {errorMessage ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <div>
                  {!isCreateMode ? (
                    <button
                      className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-50 disabled:text-rose-300"
                      disabled={isSubmitting}
                      onClick={onDelete}
                      type="button"
                    >
                      {isDeleting ? "削除中..." : "削除"}
                    </button>
                  ) : null}
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
                    disabled={
                      isSubmitting || isLoadingVenues || venues.length === 0
                    }
                    type="submit"
                  >
                    {submitLabel}
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

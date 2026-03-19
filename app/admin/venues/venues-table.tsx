"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

export type VenueTableRow = {
  id: string;
  name: string;
  address: string;
};

type VenueFormState = {
  name: string;
  address: string;
};

type VenuesTableProps = {
  createRequestCount?: number;
  onVenueCreated?: () => void;
  venues: VenueTableRow[];
};

const venueAddressMaxLength = 150;
const textInputClassName =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const primaryButtonClassName =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400";

function getInitialFormState(venue: VenueTableRow): VenueFormState {
  return {
    name: venue.name,
    address: venue.address
  };
}

function validateVenueForm(values: VenueFormState): string | null {
  const name = values.name.trim();
  const address = values.address.trim();

  if (!name || !address) {
    return "必須項目を入力してください。";
  }

  if (address.length > venueAddressMaxLength) {
    return `住所は${venueAddressMaxLength}文字以内で入力してください。`;
  }

  return null;
}

const emptyVenueFormState: VenueFormState = {
  name: "",
  address: ""
};

type ModalState =
  | {
      mode: "create";
    }
  | {
      mode: "edit";
      venueId: string;
    };

export function VenuesTable({
  createRequestCount = 0,
  onVenueCreated,
  venues
}: VenuesTableProps) {
  const [venueRows, setVenueRows] = useState(venues);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [formValues, setFormValues] = useState<VenueFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setVenueRows(venues);
  }, [venues]);

  const selectedVenue = useMemo(
    () => (modalState?.mode === "edit" ? venueRows.find((venue) => venue.id === modalState.venueId) ?? null : null),
    [modalState, venueRows]
  );

  useEffect(() => {
    if (!modalState) {
      setFormValues(null);
      setErrorMessage(null);
      return;
    }

    if (modalState.mode === "create") {
      setFormValues(emptyVenueFormState);
      setErrorMessage(null);
      return;
    }

    if (!selectedVenue) {
      setModalState(null);
      return;
    }

    setFormValues(getInitialFormState(selectedVenue));
    setErrorMessage(null);
  }, [modalState, selectedVenue]);

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

  function openVenue(venue: VenueTableRow) {
    setModalState({ mode: "edit", venueId: venue.id });
  }

  function closeModal() {
    if (!isSaving && !isDeleting) {
      setModalState(null);
    }
  }

  function updateFormValue<Key extends keyof VenueFormState>(key: Key, value: VenueFormState[Key]) {
    setFormValues((current) => (current ? { ...current, [key]: value } : current));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!modalState || !formValues) {
      return;
    }

    const validationError = validateVenueForm(formValues);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const isCreateMode = modalState.mode === "create";
      const response = await fetch(isCreateMode ? "/api/admin/venues" : `/api/admin/venues/${modalState.venueId}`, {
        method: isCreateMode ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formValues.name.trim(),
          address: formValues.address.trim()
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; venue?: VenueTableRow }
        | null;
      const venue = payload?.venue;

      if (!response.ok || !venue) {
        setErrorMessage(payload?.error ?? (isCreateMode ? "会場を追加できませんでした。" : "会場を更新できませんでした。"));
        return;
      }

      if (isCreateMode) {
        setVenueRows((current) => [venue, ...current]);
        setModalState(null);
        onVenueCreated?.();
      } else {
        setVenueRows((current) => current.map((currentVenue) => (currentVenue.id === venue.id ? venue : currentVenue)));
        setModalState(null);
      }
    } catch {
      setErrorMessage(modalState.mode === "create" ? "会場を追加できませんでした。" : "会場を更新できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  async function onDelete() {
    if (modalState?.mode !== "edit" || !selectedVenue) {
      return;
    }

    const confirmed = window.confirm(
      "この会場を削除しますか？\n紐づくスロットがある会場は削除できません。"
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/venues/${modalState.venueId}`, {
        method: "DELETE"
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; venueId?: string }
        | null;

      if (!response.ok || payload?.venueId !== modalState.venueId) {
        setErrorMessage(payload?.error ?? "会場を削除できませんでした。");
        return;
      }

      setVenueRows((current) => current.filter((venue) => venue.id !== payload.venueId));
      setModalState(null);
    } catch {
      setErrorMessage("会場を削除できませんでした。");
    } finally {
      setIsDeleting(false);
    }
  }

  const isCreateMode = modalState?.mode === "create";
  const modalTitle = isCreateMode ? "会場追加" : "会場編集";
  const modalSubtitle = isCreateMode ? "新しい会場情報を入力してください" : selectedVenue?.name ?? "";
  const isSubmitting = isSaving || isDeleting;
  const submitLabel = isSaving ? "保存中..." : isCreateMode ? "追加" : "保存";

  return (
    <>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="px-2 py-2">名前</th>
              <th className="px-2 py-2">住所</th>
            </tr>
          </thead>
          <tbody>
            {venueRows.map((venue) => (
              <tr
                aria-label={`${venue.name} の詳細を表示`}
                className="cursor-pointer border-b border-slate-100 align-top outline-none transition hover:bg-slate-50 focus:bg-slate-50"
                key={venue.id}
                onClick={() => openVenue(venue)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openVenue(venue);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <td className="px-2 py-3">{venue.name}</td>
                <td className="px-2 py-3">{venue.address}</td>
              </tr>
            ))}
            {venueRows.length === 0 ? (
              <tr>
                <td className="px-2 py-4 text-slate-500" colSpan={2}>
                  会場はありません
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
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{modalTitle}</h2>
                <p className="mt-1 text-sm text-slate-500">{modalSubtitle}</p>
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
              <div className="grid gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="venue-name">
                    名前
                  </label>
                  <input
                    className={textInputClassName}
                    id="venue-name"
                    onChange={(event) => updateFormValue("name", event.target.value)}
                    type="text"
                    value={formValues.name}
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
                    <label htmlFor="venue-address">住所</label>
                    <span>{formValues.address.length}/{venueAddressMaxLength}</span>
                  </div>
                  <input
                    className={textInputClassName}
                    id="venue-address"
                    maxLength={venueAddressMaxLength}
                    onChange={(event) => updateFormValue("address", event.target.value)}
                    type="text"
                    value={formValues.address}
                  />
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
                  <button className={primaryButtonClassName} disabled={isSubmitting} type="submit">
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

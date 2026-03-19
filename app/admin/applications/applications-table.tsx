"use client";

import type { SlotApplicationStatus } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { getGenderLabel, getSlotApplicationStatusLabel, type StoredGender } from "@/lib/labels";
import { formatAdminSlotDateTimeRange } from "@/lib/slot-display";

export type ApplicationTableRow = {
  id: string;
  submissionEmail: string;
  submissionName: string;
  submissionFurigana: string;
  submissionGender: StoredGender | null;
  submissionAge: number | null;
  submissionPrefecture: string | null;
  submissionMemo: string | null;
  venueName: string;
  startsAt: string;
  endsAt: string;
  status: SlotApplicationStatus;
  createdAt: string;
};

type ApplicationsTableProps = {
  applications: ApplicationTableRow[];
  statusOptions: SlotApplicationStatus[];
};

function formatApplicationCreatedAt(value: string): string {
  const date = new Date(value);

  const dateText = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);

  const timeText = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);

  return `${dateText} ${timeText}`;
}

const detailFieldClassName =
  "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800";

export function ApplicationsTable({ applications, statusOptions }: ApplicationsTableProps) {
  const [applicationRows, setApplicationRows] = useState(applications);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [statusValue, setStatusValue] = useState<SlotApplicationStatus | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setApplicationRows(applications);
  }, [applications]);

  const selectedApplication = useMemo(
    () => applicationRows.find((application) => application.id === selectedApplicationId) ?? null,
    [applicationRows, selectedApplicationId]
  );

  useEffect(() => {
    if (!selectedApplication) {
      setStatusValue("");
      setErrorMessage(null);
      return;
    }

    setStatusValue(selectedApplication.status);
    setErrorMessage(null);
  }, [selectedApplication]);

  useEffect(() => {
    if (!selectedApplicationId || isSaving || isDeleting) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedApplicationId(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, isSaving, selectedApplicationId]);

  function openApplication(application: ApplicationTableRow) {
    setSelectedApplicationId(application.id);
  }

  async function updateApplicationStatus() {
    if (!selectedApplication || !statusValue) {
      setErrorMessage("状態を選択してください。");
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status: statusValue
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; application?: { id: string; status: SlotApplicationStatus } }
        | null;

      if (!response.ok || !payload?.application) {
        setErrorMessage(payload?.error ?? "応募状態を更新できませんでした。");
        return;
      }

      setApplicationRows((current) =>
        current.map((application) =>
          application.id === payload.application?.id
            ? { ...application, status: payload.application.status }
            : application
        )
      );
      setSelectedApplicationId(null);
    } catch {
      setErrorMessage("応募状態を更新できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteApplication() {
    if (!selectedApplication) {
      return;
    }

    const confirmed = window.confirm("この応募を削除しますか？");
    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}`, {
        method: "DELETE"
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; applicationId?: string }
        | null;

      if (!response.ok || payload?.applicationId !== selectedApplication.id) {
        setErrorMessage(payload?.error ?? "応募を削除できませんでした。");
        return;
      }

      setApplicationRows((current) =>
        current.filter((application) => application.id !== payload.applicationId)
      );
      setSelectedApplicationId(null);
    } catch {
      setErrorMessage("応募を削除できませんでした。");
    } finally {
      setIsDeleting(false);
    }
  }

  const isSubmitting = isSaving || isDeleting;

  return (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-600">
              <th className="px-2 py-2">メイル</th>
              <th className="px-2 py-2">会場</th>
              <th className="px-2 py-2">スロット日時</th>
              <th className="px-2 py-2">状態</th>
              <th className="px-2 py-2">応募日時</th>
            </tr>
          </thead>
          <tbody>
            {applicationRows.map((application) => (
              <tr
                aria-label={`${application.submissionName} の応募詳細を表示`}
                className="cursor-pointer border-b border-slate-100 align-top outline-none transition hover:bg-slate-50 focus:bg-slate-50"
                key={application.id}
                onClick={() => openApplication(application)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openApplication(application);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <td className="px-2 py-3">{application.submissionEmail}</td>
                <td className="px-2 py-3">{application.venueName}</td>
                <td className="px-2 py-3">{formatAdminSlotDateTimeRange(application.startsAt, application.endsAt)}</td>
                <td className="px-2 py-3">{getSlotApplicationStatusLabel(application.status)}</td>
                <td className="px-2 py-3">{formatApplicationCreatedAt(application.createdAt)}</td>
              </tr>
            ))}
            {applicationRows.length === 0 ? (
              <tr>
                <td className="px-2 py-4 text-slate-500" colSpan={8}>
                  応募はありません
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedApplication ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => {
            if (!isSubmitting) {
              setSelectedApplicationId(null);
            }
          }}
          role="dialog"
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">応募詳細</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedApplication.submissionName}</p>
              </div>
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                disabled={isSubmitting}
                onClick={() => setSelectedApplicationId(null)}
                type="button"
              >
                閉じる
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">メイル</p>
                <div className={detailFieldClassName}>{selectedApplication.submissionEmail}</div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">名前</p>
                <div className={detailFieldClassName}>{selectedApplication.submissionName}</div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">フリガナ</p>
                <div className={detailFieldClassName}>{selectedApplication.submissionFurigana}</div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">性別</p>
                <div className={detailFieldClassName}>{selectedApplication.submissionGender ? getGenderLabel(selectedApplication.submissionGender) : "—"}</div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">年齢</p>
                <div className={detailFieldClassName}>{selectedApplication.submissionAge ?? "—"}</div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">居住地</p>
                <div className={detailFieldClassName}>{selectedApplication.submissionPrefecture ?? "—"}</div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">会場</p>
                <div className={detailFieldClassName}>{selectedApplication.venueName}</div>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-slate-600">状態</p>
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                  disabled={isSubmitting}
                  onChange={(event) => setStatusValue(event.target.value as SlotApplicationStatus)}
                  value={statusValue}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {getSlotApplicationStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-600">スロット日時</p>
                <div className={detailFieldClassName}>
                  {formatAdminSlotDateTimeRange(selectedApplication.startsAt, selectedApplication.endsAt)}
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-600">応募日時</p>
                <div className={detailFieldClassName}>{formatApplicationCreatedAt(selectedApplication.createdAt)}</div>
              </div>
              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-600">ペットについて</p>
                <div className={detailFieldClassName + " whitespace-pre-wrap"}>{selectedApplication.submissionMemo ?? "—"}</div>
              </div>
              {errorMessage ? (
                <p className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}
              <div className="md:col-span-2 flex justify-end gap-3">
                <div className="flex w-full items-center justify-between gap-3">
                  <div>
                    <button
                      className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:border-rose-200 disabled:bg-rose-50 disabled:text-rose-300"
                      disabled={isSubmitting}
                      onClick={deleteApplication}
                      type="button"
                    >
                      {isDeleting ? "削除中..." : "削除"}
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                      disabled={isSubmitting}
                      onClick={() => setSelectedApplicationId(null)}
                      type="button"
                    >
                      キャンセル
                    </button>
                    <button
                      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={isSubmitting}
                      onClick={updateApplicationStatus}
                      type="button"
                    >
                      {isSaving ? "保存中..." : "保存"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

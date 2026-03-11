"use client";

import { FormEvent, useMemo, useState } from "react";

type SlotOption = {
  id: string;
  label: string;
};

type LotteryRowResult = {
  id: string;
  submissionName: string;
  submissionEmail: string;
  preferenceRank: number;
  status: "ACCEPTED" | "WAITLISTED";
};

type LotteryResult = {
  slot: {
    id: string;
    venueName: string;
    startsAt: string;
    endsAt: string;
    state: string;
  };
  eligibleCount: number;
  acceptedCount: number;
  waitlistedCount: number;
  accepted: LotteryRowResult[];
  waitlisted: LotteryRowResult[];
};

type LotteryRunnerProps = {
  slots: SlotOption[];
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

export function LotteryRunner({ slots }: LotteryRunnerProps) {
  const [targetSlotId, setTargetSlotId] = useState("");
  const [successCountText, setSuccessCountText] = useState("0");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LotteryResult | null>(null);

  const hasSlots = slots.length > 0;
  const parsedSuccessCount = useMemo(() => Number.parseInt(successCountText, 10), [successCountText]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!targetSlotId) {
      setError("Please select a slot.");
      return;
    }

    if (!Number.isInteger(parsedSuccessCount) || parsedSuccessCount < 0) {
      setError("Success count must be a non-negative integer.");
      return;
    }

    if (!window.confirm("Run lottery now? This will update application statuses for the selected slot.")) {
      return;
    }

    setIsRunning(true);

    try {
      const response = await fetch("/api/admin/lottery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          targetSlotId,
          successCount: parsedSuccessCount
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; result?: LotteryResult }
        | null;

      if (!response.ok || !payload?.result) {
        setError(payload?.error ?? "Unable to run lottery.");
        return;
      }

      setResult(payload.result);
    } catch {
      setError("Unable to run lottery.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="mt-4 space-y-6">
      <form className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-3" onSubmit={onSubmit}>
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          disabled={!hasSlots || isRunning}
          onChange={(event) => setTargetSlotId(event.target.value)}
          required
          value={targetSlotId}
        >
          <option value="">{hasSlots ? "Select slot" : "No closed slots available"}</option>
          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>

        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          disabled={!hasSlots || isRunning}
          min={0}
          onChange={(event) => setSuccessCountText(event.target.value)}
          step={1}
          type="number"
          value={successCountText}
        />

        <button
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={!hasSlots || isRunning}
          type="submit"
        >
          {isRunning ? "Running..." : "Run Lottery"}
        </button>
      </form>

      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      {result ? (
        <section className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Lottery Result</h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-700">
            <p>
              <span className="font-medium">Selected Slot:</span> {result.slot.venueName} |{" "}
              {formatDateTime(result.slot.startsAt)} - {formatDateTime(result.slot.endsAt)} | {result.slot.state}
            </p>
            <p>
              <span className="font-medium">Eligible Applications:</span> {result.eligibleCount}
            </p>
            <p>
              <span className="font-medium">Accepted:</span> {result.acceptedCount}
            </p>
            <p>
              <span className="font-medium">Waitlisted:</span> {result.waitlistedCount}
            </p>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-900">Accepted Applicants</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Preference Rank</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.accepted.map((row) => (
                    <tr className="border-b border-slate-100" key={row.id}>
                      <td className="px-2 py-2">{row.submissionName}</td>
                      <td className="px-2 py-2">{row.submissionEmail}</td>
                      <td className="px-2 py-2">{row.preferenceRank}</td>
                      <td className="px-2 py-2">{row.status}</td>
                    </tr>
                  ))}
                  {result.accepted.length === 0 ? (
                    <tr>
                      <td className="px-2 py-2 text-slate-500" colSpan={4}>
                        No accepted applicants.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-slate-900">Waitlisted Applicants</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="px-2 py-2">Name</th>
                    <th className="px-2 py-2">Email</th>
                    <th className="px-2 py-2">Preference Rank</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.waitlisted.map((row) => (
                    <tr className="border-b border-slate-100" key={row.id}>
                      <td className="px-2 py-2">{row.submissionName}</td>
                      <td className="px-2 py-2">{row.submissionEmail}</td>
                      <td className="px-2 py-2">{row.preferenceRank}</td>
                      <td className="px-2 py-2">{row.status}</td>
                    </tr>
                  ))}
                  {result.waitlisted.length === 0 ? (
                    <tr>
                      <td className="px-2 py-2 text-slate-500" colSpan={4}>
                        No waitlisted applicants.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}


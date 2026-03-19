"use client";

import { useState } from "react";
import type { SlotState } from "@prisma/client";
import { Icon } from "@/components/icon";
import { formatDate, formatMonthDay } from "@/lib/format-date";

type SlotData = {
  id: string;
  eventName: string;
  theme: string;
  instructor: string;
  capacity: number;
  applicationBegin: string;
  applicationDeadline: string;
  startsAt: string;
  endsAt: string;
  state: SlotState;
  venue: { name: string; address: string };
};

type ApplyContentProps = {
  initialSelectedSlots: SlotData[];
  otherSlots: SlotData[];
};

function ApplyCard({
  slot,
  selected,
  onToggle,
}: {
  slot: SlotData;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex flex-col gap-2 overflow-hidden rounded-2xl bg-white p-4 outline-brand-green transition-all duration-100 ease-in-out cursor-pointer ${
        selected
          ? "border outline border-brand-green shadow-md"
          : "border border-warm-200"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                className={`flex size-6 items-center justify-center rounded-full border transition-colors ${
                  selected
                    ? "border-white bg-brand-green"
                    : "border-warm-400 bg-white/70"
                }`}
              >
                {selected && (
                  <Icon className="text-white" name="Check" size={16} />
                )}
              </button>
              <span className="text-lg font-bold text-warm-900">
                {formatDate(slot.startsAt)}
              </span>
              {/* <span className="inline-flex items-center rounded-full bg-brand-green-bg px-2.5 py-0.5 text-[11px] font-semibold text-brand-green-text">
              募集中
            </span> */}
            </div>
          </div>
          <h3 className="text-xl font-bold text-warm-900">{slot.eventName}</h3>
        </div>
      </div>

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
        <div className="flex items-center gap-2 text-[13px]">
          <div className="text-warm-500 min-w-13">応募期限</div>
          <span className="text-warm-900">{formatMonthDay(slot.applicationDeadline)}</span>
        </div>
      </div>
    </div>
  );
}

export function ApplyContent({
  initialSelectedSlots,
  otherSlots,
}: ApplyContentProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialSelectedSlots.map((s) => s.id)),
  );

  const allSlots = [...initialSelectedSlots, ...otherSlots];
  const selectedSlots = allSlots.filter((s) => selectedIds.has(s.id));
  const unselectedSlots = allSlots.filter((s) => !selectedIds.has(s.id));

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-2 pt-6 text-center md:py-8">
        <h1 className="text-[28px] font-bold text-warm-900">
          イベント参加申し込み
        </h1>
        <p className="mt-2 text-sm text-warm-500">
          気に​なる​イベントを最大3件まで​申し込むことができます。​
        </p>
      </div>

      {selectedSlots.length > 0 && (
        <div className="w-full mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="size-2 rounded bg-brand-green" />
            <span className="text-base font-bold text-warm-900">
              このイベントに申し込む
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {selectedSlots.map((slot) => (
              <ApplyCard
                key={slot.id}
                slot={slot}
                selected={true}
                onToggle={() => toggleSelection(slot.id)}
              />
            ))}
          </div>
        </div>
      )}

      {unselectedSlots.length > 0 && (
        <div className="w-full mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6">
          <div className="flex items-center gap-2.5">
            <Icon className="text-warm-900" name="CirclePlus" size={20} />
            <span className="text-base font-bold text-warm-900">
              その他のイベントにも申し込む
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {unselectedSlots.map((slot) => (
              <ApplyCard
                key={slot.id}
                slot={slot}
                selected={false}
                onToggle={() => toggleSelection(slot.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div
        className="sticky bottom-0 bg-white py-4"
        style={{
          boxShadow:
            "0 0 15px -3px rgb(0 0 0 / 0.1), 0 0 6px -4px rgb(0 0 0 / 0.1)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="flex items-center gap-2.5"
            >
              <div
                className={`flex size-[22px] items-center justify-center rounded-[5px] bg-brand-green ${
                  selectedIds.size > 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                <Icon className="text-white" name="Check" size={16} />
              </div>
              <span className="text-sm font-medium text-warm-900">
                {selectedIds.size}件のイベントを選択中
              </span>
              <div
                className={` ${
                  selectedIds.size > 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                <Icon className="text-warm-400" name="X" size={14} />
              </div>
            </button>
          </div>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/"
              className="flex h-11 w-[140px] items-center justify-center rounded-full border border-warm-200 bg-white text-sm font-bold text-warm-500 transition-colors hover:bg-warm-50"
            >
              戻る
            </a>
            <a
              href={
                selectedIds.size > 0
                  ? `/event/apply/form?slots=${Array.from(selectedIds).join(",")}`
                  : "#"
              }
              className={`flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white transition-colors ${
                selectedIds.size > 0
                  ? "bg-brand-green hover:bg-brand-green-dark"
                  : "pointer-events-none bg-warm-400"
              }`}
            >
              まとめて申し込む
              <Icon className="text-white" name="ChevronRight" size={16} />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

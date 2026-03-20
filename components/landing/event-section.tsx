"use client";

import { useState } from "react";
import Image from "next/image";
import type { SlotState } from "@prisma/client";
import { Icon } from "@/components/icon";
import { SectionHeading } from "@/components/landing/section-heading";
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

type EventSectionProps = {
  acceptingSlots: SlotData[];
  comingSlots: SlotData[];
};

function EventCard({
  slot,
  variant,
  selected,
  onToggle,
}: {
  slot: SlotData;
  variant: "accepting" | "coming";
  selected?: boolean;
  onToggle?: () => void;
}) {
  const isAccepting = variant === "accepting";

  return (
    <div
      className={`flex flex-col gap-2 overflow-hidden rounded-2xl bg-white p-4 outline-brand-green transition-all duration-100 ease-in-out ${selected
        ? "border outline border-brand-green shadow-md"
        : "border border-warm-200"
        }`}
      onClick={onToggle}
    >
      <div className="flex items-start">
        <div className="flex flex-1 flex-col gap-2">
          {isAccepting && (
            <div className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                className={`flex size-6 items-center justify-center rounded-full border transition-colors cursor-pointer ${selected
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
          )}
          {/* {!isAccepting && (
            <span className="inline-flex w-fit items-center rounded-full bg-status-amber-bg px-2.5 py-0.5 text-[11px] font-semibold text-status-amber">
              準備中
            </span>
          )} */}
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

      {isAccepting && (
        <a
          href={`/event/apply/?slots=${slot.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex h-11 mt-auto items-center justify-center rounded-full bg-brand-green text-sm font-bold text-white transition-colors hover:bg-brand-green-dark cursor-pointer"
        >
          抽選に応募する
        </a>
      )}
      {!isAccepting && (
        <div className="flex h-11 items-center justify-center rounded-full bg-warm-300 text-[13px] text-warm-500">
          Coming Soon
        </div>
      )}
    </div>
  );
}

export function EventSection({
  acceptingSlots,
  comingSlots,
}: EventSectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAllAccepting, setShowAllAccepting] = useState(false);
  const [showAllComing, setShowAllComing] = useState(false);

  const INITIAL_SHOW_COUNT = 12;

  const visibleAccepting = showAllAccepting
    ? acceptingSlots
    : acceptingSlots.slice(0, INITIAL_SHOW_COUNT);
  const visibleComing = showAllComing
    ? comingSlots
    : comingSlots.slice(0, INITIAL_SHOW_COUNT);

  const remainingAccepting = acceptingSlots.length - INITIAL_SHOW_COUNT;
  const remainingComing = comingSlots.length - INITIAL_SHOW_COUNT;

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
      <section
        id="events"
        className="bg-warm-100 px-4 py-8 pb-16 md:px-8 md:py-16 overflow-hidden"
      >
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8">
          <SectionHeading sub="Schedule" label={`開催スケジュール`} />
          <div className="absolute z-10 -bottom-12 -right-0 rotate-180">
            <Image
              // className="slideDown"
              src="/images/fig-cat.jpg"
              alt=""
              width={95}
              height={120}
            />
          </div>

          <p className="text-base leading-7 text-warm-600 md:text-center">
            以下の各日程にてイベント開催予定です。
            <br />
            参加費は​無料ですが、人数に限りがあるため、必ずしも当選するとは限りません。
            <br />
            各回ごとに​テーマ・内容・会場・​担当者が​異なりますので、<br />
            参加可能な日程で興味のあるテーマの日程を3件選択してご応募ください。
            <br />
            開催内容は​変更に​なる​可能性も​ありますので​ご了承ください。
          </p>

          {acceptingSlots.length > 0 && (
            <div className="relative z-30 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="size-2 rounded bg-brand-green-text" />
                <span className="text-[15px] font-bold text-warm-900">
                  抽選応募受付中の​イベント
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {visibleAccepting.map((slot) => (
                  <EventCard
                    key={slot.id}
                    slot={slot}
                    variant="accepting"
                    selected={selectedIds.has(slot.id)}
                    onToggle={() => toggleSelection(slot.id)}
                  />
                ))}
              </div>
              {/* {!showAllAccepting && remainingAccepting > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllAccepting(true)}
                  className="flex items-center justify-center gap-2 text-[13px] font-medium text-warm-500"
                >
                  他 {remainingAccepting}件のイベントを表示
                  <Icon
                    className="text-warm-500"
                    name="ChevronRight"
                    size={16}
                  />
                </button>
              )} */}
            </div>
          )}

          {comingSlots.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="size-2 rounded bg-warm-500" />
                <span className="text-[15px] font-bold text-warm-900">
                  抽選応募準備中のイベント
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {visibleComing.map((slot) => (
                  <EventCard key={slot.id} slot={slot} variant="coming" />
                ))}
              </div>
              {!showAllComing && remainingComing > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllComing(true)}
                  className="flex items-center justify-center gap-2 text-[13px] font-medium text-warm-500"
                >
                  他 {remainingComing}件のイベントを表示
                  <Icon
                    className="text-warm-500"
                    name="ChevronRight"
                    size={16}
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <div
        className={`sticky bottom-0 z-50 bg-white px-4 transition-all duration-500 ease-in-out overflow-hidden ${selectedIds.size > 0
          ? "h-[106px] translate-y-0 opacity-100"
          : "h-0 min-h-0 pointer-events-none translate-y-full opacity-0"
          }`}
        style={{
          boxShadow:
            "0 0 15px -3px rgb(0 0 0 / 0.1), 0 0 6px -4px rgb(0 0 0 / 0.1)",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 py-4">
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="flex items-center gap-2.5"
          >
            <div
              className={`flex size-[22px] items-center justify-center rounded-[5px] bg-brand-green ${selectedIds.size > 0 ? "opacity-100" : "opacity-0"
                }`}
            >
              <Icon className="text-white" name="Check" size={16} />
            </div>
            <span className="text-sm font-medium text-warm-900">
              {selectedIds.size}件のイベントを選択中
            </span>
            <Icon className="text-warm-400" name="X" size={14} />
          </button>
          <a
            href={`/event/apply?slots=${Array.from(selectedIds).join(",")}`}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-full bg-brand-green text-sm font-bold text-white transition-colors hover:bg-brand-green-dark md:w-auto md:px-12"
          >
            まとめて応募する
            <Icon className="text-white" name="ChevronRight" size={16} />
          </a>
        </div>
      </div>
    </>
  );
}

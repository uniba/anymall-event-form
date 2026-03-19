"use client";

import type { SlotApplicationStatus } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import { getSlotApplicationStatusLabel } from "@/lib/labels";

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
const slotSelectClassName =
  `${inputClassName} w-full sm:w-[32rem] max-w-full overflow-hidden text-ellipsis whitespace-nowrap`;

export type ApplicationFilterVenueOption = {
  id: string;
  name: string;
};

export type ApplicationFilterSlotOption = {
  id: string;
  venueId: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
};

type ApplicationFiltersProps = {
  venues: ApplicationFilterVenueOption[];
  slots: ApplicationFilterSlotOption[];
  defaultEmail: string;
  defaultVenue: string;
  defaultSlot: string;
  defaultStatus: string;
  statusOptions: SlotApplicationStatus[];
};

function slotLabel(slot: ApplicationFilterSlotOption): string {
  return `${slot.venueName} | ${new Date(slot.startsAt).toLocaleString()} - ${new Date(slot.endsAt).toLocaleString()}`;
}

export function ApplicationFilters({
  venues,
  slots,
  defaultEmail,
  defaultVenue,
  defaultSlot,
  defaultStatus,
  statusOptions
}: ApplicationFiltersProps) {
  const [selectedVenue, setSelectedVenue] = useState(defaultVenue);
  const [selectedSlot, setSelectedSlot] = useState(defaultSlot);

  useEffect(() => {
    setSelectedVenue(defaultVenue);
  }, [defaultVenue]);

  useEffect(() => {
    setSelectedSlot(defaultSlot);
  }, [defaultSlot]);

  const filteredSlots = useMemo(() => {
    if (!selectedVenue) {
      return slots;
    }

    return slots.filter((slot) => slot.venueId === selectedVenue);
  }, [selectedVenue, slots]);
  const selectedSlotOption = slots.find((slot) => slot.id === selectedSlot);
  const selectedSlotTitle = selectedSlotOption ? slotLabel(selectedSlotOption) : "All slots";

  useEffect(() => {
    if (!selectedSlot) {
      return;
    }

    const selectedSlotStillVisible = filteredSlots.some((slot) => slot.id === selectedSlot);

    if (!selectedSlotStillVisible) {
      setSelectedSlot("");
    }
  }, [filteredSlots, selectedSlot]);

  return (
    <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-email">
          メールアドレスまたは名前
        </label>
        <input
          className={inputClassName}
          defaultValue={defaultEmail}
          id="filter-email-name"
          name="email"
          placeholder="メールアドレスまたは名前"
          type="text"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-venue">
          会場
        </label>
        <select
          className={inputClassName}
          id="filter-venue"
          name="venue"
          onChange={(event) => setSelectedVenue(event.target.value)}
          value={selectedVenue}
        >
          <option value="">全部</option>
          {venues.map((venue) => (
            <option key={venue.id} value={venue.id}>
              {venue.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full min-w-0 sm:w-auto">
        <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-slot">
          スロット
        </label>
        <select
          className={slotSelectClassName}
          id="filter-slot"
          name="slot"
          onChange={(event) => setSelectedSlot(event.target.value)}
          title={selectedSlotTitle}
          value={selectedSlot}
        >
          <option value="">全部</option>
          {filteredSlots.map((slot) => (
            <option key={slot.id} title={slotLabel(slot)} value={slot.id}>
              {slotLabel(slot)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-status">
          状態
        </label>
        <select className={inputClassName} defaultValue={defaultStatus} id="filter-status" name="status">
          <option value="">全部</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {getSlotApplicationStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>
      <button className={secondaryButtonClassName} type="submit">
        検査
      </button>
    </form>
  );
}

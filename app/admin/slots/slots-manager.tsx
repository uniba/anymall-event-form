"use client";

import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSlotStateLabel } from "@/lib/labels";
import { slotStateOptions } from "@/lib/admin-slot-validation";
import { SlotsTable, type SlotTableRow } from "./slots-table";

type VenueFilterOption = {
  id: string;
  name: string;
};

type SlotsManagerProps = {
  initialSlots: SlotTableRow[];
  initialStateFilter: string;
  initialVenueFilter: string;
  venues: VenueFilterOption[];
};

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const primaryButtonClassName =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

export function SlotsManager({
  initialSlots,
  initialStateFilter,
  initialVenueFilter,
  venues
}: SlotsManagerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [venueFilter, setVenueFilter] = useState(initialVenueFilter);
  const [stateFilter, setStateFilter] = useState(initialStateFilter);
  const [createRequestCount, setCreateRequestCount] = useState(0);

  useEffect(() => {
    setVenueFilter(initialVenueFilter);
  }, [initialVenueFilter]);

  useEffect(() => {
    setStateFilter(initialStateFilter);
  }, [initialStateFilter]);

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams();
    if (venueFilter) {
      params.set("venue", venueFilter);
    }
    if (stateFilter) {
      params.set("state", stateFilter);
    }

    const url = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(url);
    router.refresh();
  }

  function onSlotCreated() {
    setVenueFilter("");
    setStateFilter("");
    router.replace(pathname);
    router.refresh();
  }

  return (
    <>
      <form className="mt-4 flex flex-wrap items-end justify-between gap-3" onSubmit={onSearchSubmit}>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-venue">
              会場
            </label>
            <select
              className={inputClassName}
              id="filter-venue"
              name="venue"
              onChange={(event) => setVenueFilter(event.target.value)}
              value={venueFilter}
            >
              <option value="">全部</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-state">
              状態
            </label>
            <select
              className={inputClassName}
              id="filter-state"
              name="state"
              onChange={(event) => setStateFilter(event.target.value)}
              value={stateFilter}
            >
              <option value="">全部</option>
              {slotStateOptions.map((state) => (
                <option key={state} value={state}>
                  {getSlotStateLabel(state)}
                </option>
              ))}
            </select>
          </div>

          <button className={secondaryButtonClassName} type="submit">
            検索
          </button>
        </div>

        <button
          className={primaryButtonClassName}
          onClick={() => setCreateRequestCount((current) => current + 1)}
          type="button"
        >
          add a new slot
        </button>
      </form>

      <div className="mt-6">
        <p className="mb-1 block text-xs font-medium text-slate-600">スロット件数 {initialSlots.length}</p>
      </div>

      <SlotsTable
        createRequestCount={createRequestCount}
        onSlotCreated={onSlotCreated}
        slots={initialSlots}
      />
    </>
  );
}

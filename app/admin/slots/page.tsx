import { SlotState } from "@prisma/client";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { getSlotStateLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { SlotsTable, type SlotTableRow } from "./slots-table";

type SlotsPageProps = {
  searchParams?: Promise<{ venue?: string; state?: string }>;
};

const slotStateOptions = Object.values(SlotState);

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500";
const secondaryButtonClassName =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

function isSlotState(value: string): value is SlotState {
  return slotStateOptions.includes(value as SlotState);
}

export default async function AdminSlotsPage({ searchParams }: SlotsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const venueFilter = params?.venue?.trim() ?? "";
  const stateFilterRaw = params?.state?.trim() ?? "";
  const stateFilter = isSlotState(stateFilterRaw) ? stateFilterRaw : "";

  const [venues, slots] = await Promise.all([
    prisma.venue.findMany({
      orderBy: {
        name: "asc"
      }
    }),
    prisma.slot.findMany({
      where: {
        ...(venueFilter ? { venueId: venueFilter } : {}),
        ...(stateFilter ? { state: stateFilter } : {})
      },
      include: {
        venue: true
      },
      orderBy: {
        startsAt: "asc"
      }
    })
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <AdminNav active="slots" />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Slots</h1>

        <form className="mt-4 flex flex-wrap items-end gap-3" method="get">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="filter-venue">
              会場
            </label>
            <select className={inputClassName} defaultValue={venueFilter} id="filter-venue" name="venue">
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
            <select className={inputClassName} defaultValue={stateFilter} id="filter-state" name="state">
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
        </form>

        <div className="mt-6">
          <p className="mb-1 block text-xs font-medium text-slate-600">
            スロット件数 {slots.length} 
          </p>
        </div>

        <SlotsTable
          slots={slots.map(
            (slot): SlotTableRow => ({
              id: slot.id,
              eventName: slot.eventName,
              venueId: slot.venueId,
              venueName: slot.venue.name,
              theme: slot.theme,
              instructor: slot.instructor,
              capacity: slot.capacity,
              applicationBegin: slot.applicationBegin.toISOString(),
              applicationDeadline: slot.applicationDeadline.toISOString(),
              lotteryResultTime: slot.lotteryResultTime.toISOString(),
              startsAt: slot.startsAt.toISOString(),
              endsAt: slot.endsAt.toISOString(),
              state: slot.state
            })
          )}
        />
      </section>
    </main>
  );
}

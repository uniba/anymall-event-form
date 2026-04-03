import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { slotStateOptions } from "@/lib/admin-slot-validation";
import { prisma } from "@/lib/prisma";
import { SlotsManager } from "./slots-manager";
import type { SlotTableRow } from "./slots-table";

type SlotsPageProps = {
  searchParams?: Promise<{ venue?: string; state?: string; visibility?: string }>;
};

function isSlotState(value: string): value is (typeof slotStateOptions)[number] {
  return slotStateOptions.includes(value as (typeof slotStateOptions)[number]);
}

function isVisibilityFilter(value: string): value is "visible" | "hidden" {
  return value === "visible" || value === "hidden";
}

export default async function AdminSlotsPage({ searchParams }: SlotsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const venueFilter = params?.venue?.trim() ?? "";
  const stateFilterRaw = params?.state?.trim() ?? "";
  const stateFilter = isSlotState(stateFilterRaw) ? stateFilterRaw : "";
  const visibilityFilterRaw = params?.visibility?.trim() ?? "";
  const visibilityFilter = isVisibilityFilter(visibilityFilterRaw) ? visibilityFilterRaw : "";

  const [venues, slots] = await Promise.all([
    prisma.venue.findMany({
      orderBy: {
        name: "asc"
      }
    }),
    prisma.slot.findMany({
      where: {
        ...(venueFilter ? { venueId: venueFilter } : {}),
        ...(stateFilter ? { state: stateFilter } : {}),
        ...(visibilityFilter ? { hidden: visibilityFilter === "hidden" } : {})
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

        <SlotsManager
          initialSlots={slots.map(
            (slot): SlotTableRow => ({
              id: slot.id,
              eventName: slot.eventName,
              venueId: slot.venueId,
              venueName: slot.venue.name,
              hidden: slot.hidden,
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
          initialVisibilityFilter={visibilityFilter}
          initialStateFilter={stateFilter}
          initialVenueFilter={venueFilter}
          venues={venues.map((venue) => ({
            id: venue.id,
            name: venue.name
          }))}
        />
      </section>
    </main>
  );
}

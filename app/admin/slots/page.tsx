import { SlotState } from "@prisma/client";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { getSlotStateLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { getCapacityLabel, getThemeBulletLines } from "@/lib/slot-display";

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

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-2 py-2">イベント名</th>
                <th className="px-2 py-2">会場</th>
                <th className="px-2 py-2">インストラクター</th>
                <th className="px-2 py-2">テーマ</th>
                <th className="px-2 py-2">定員</th>
                <th className="px-2 py-2">応募開始日時</th>
                <th className="px-2 py-2">応募締切日時</th>
                <th className="px-2 py-2">抽選結果発表日時</th>
                <th className="px-2 py-2">開始日時</th>
                <th className="px-2 py-2">終了日時</th>
                <th className="px-2 py-2">状態</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot) => (
                <tr className="border-b border-slate-100 align-top" key={slot.id}>
                  <td className="px-2 py-3">{slot.eventName}</td>
                  <td className="px-2 py-3">{slot.venue.name}</td>
                  <td className="px-2 py-3">{slot.instructor}</td>
                  <td className="px-2 py-3">
                    <ul className="space-y-1">
                      {getThemeBulletLines(slot.theme).map((line) => (
                        <li key={line}>• {line}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-2 py-3">{getCapacityLabel(slot.capacity)}</td>
                  <td className="px-2 py-3">{slot.applicationBegin.toLocaleString()}</td>
                  <td className="px-2 py-3">{slot.applicationDeadline.toLocaleString()}</td>
                  <td className="px-2 py-3">{slot.lotteryResultTime.toLocaleString()}</td>
                  <td className="px-2 py-3">{slot.startsAt.toLocaleString()}</td>
                  <td className="px-2 py-3">{slot.endsAt.toLocaleString()}</td>
                  <td className="px-2 py-3">{getSlotStateLabel(slot.state)}</td>
                </tr>
              ))}
              {slots.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-slate-500" colSpan={10}>
                    スロットはありません
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

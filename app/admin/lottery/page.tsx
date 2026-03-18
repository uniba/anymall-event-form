import { SlotState } from "@prisma/client";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { getSlotStateLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatAdminSlotDateTimeRange, getCapacityLabel } from "@/lib/slot-display";
import { LotteryRunner } from "./lottery-runner";

export default async function AdminLotteryPage() {
  await requireAdminSession();

  const slots = await prisma.slot.findMany({
    where: {
      state: SlotState.APPLICATIONS_CLOSED
    },
    include: {
      venue: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      startsAt: "asc"
    }
  });

  const slotOptions = slots.map((slot) => ({
    id: slot.id,
    label:
      `${slot.eventName} | ${slot.venue.name} | ${formatAdminSlotDateTimeRange(slot.startsAt, slot.endsAt)} | ` +
      `${getCapacityLabel(slot.capacity)} | ${getSlotStateLabel(slot.state)}`
  }));

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <AdminNav active="lottery" />

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">抽選</h1>
        <p className="mt-2 text-sm text-slate-600">
          受付終了したスロットを選択し、当選人数を入力して抽選を実行します。
        </p>

        <LotteryRunner slots={slotOptions} />
      </section>
    </main>
  );
}

import { SlotState } from "@prisma/client";
import { AdminNav } from "@/components/admin-nav";
import { requireAdminSession } from "@/lib/admin-guard";
import { getSlotStateLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { LotteryRunner } from "./lottery-runner";

function formatDate(date: Date): string {
  const datePart = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
  return `${datePart} ${timePart}`;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

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
    label: `${slot.venue.name} — ${formatDate(slot.startsAt)} to ${formatTime(slot.endsAt)} — ${getSlotStateLabel(slot.state)}`
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

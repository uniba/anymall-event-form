import { SlotState } from "@prisma/client";
import { ApplicationForm } from "@/components/application-form";
import { prisma } from "@/lib/prisma";
import { getCapacityLabel, getThemeSummary } from "@/lib/slot-display";

export default async function HomePage() {
  const slots = await prisma.slot.findMany({
    where: {
      state: SlotState.ACCEPTING_APPLICATIONS
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

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const slotOptions = slots.map((slot) => ({
    id: slot.id,
    label:
      `${slot.eventName} | ${slot.venue.name} | ` +
      `${dayFormatter.format(slot.startsAt)}, ${timeFormatter.format(slot.startsAt)}–${timeFormatter.format(slot.endsAt)}` 
  }));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Application Form</h1>
        <p className="mt-2 text-sm text-slate-600">
          Submit your details. A confirmation email will be sent after successful submission.
        </p>
        <ApplicationForm slotOptions={slotOptions} />
      </section>
    </main>
  );
}

import { SlotState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ApplyForm } from "@/components/landing/apply-form";

type SlotData = {
  id: string;
  eventName: string;
  startsAt: string;
  endsAt: string;
  venue: { name: string; address: string };
  instructor: string;
};

export default async function ApplyFormPage({
  searchParams,
}: {
  searchParams: Promise<{ slots?: string }>;
}) {
  const { slots: slotsParam } = await searchParams;
  const slotIds = slotsParam ? slotsParam.split(",").filter(Boolean) : [];

  const slots = await prisma.slot.findMany({
    where: { id: { in: slotIds }, state: SlotState.ACCEPTING_APPLICATIONS },
    include: { venue: { select: { name: true, address: true } } },
    orderBy: { startsAt: "asc" },
  });

  const serializedSlots: SlotData[] = slots.map((s) => ({
    id: s.id,
    eventName: s.eventName,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    venue: s.venue,
    instructor: s.instructor,
  }));

  return (
    <main className="flex flex-col min-h-screen bg-warm-100 font-sans">
      <Header />
      <div className="flex flex-col flex-1">
        <ApplyForm slots={serializedSlots} />
        <Footer />
      </div>
    </main>
  );
}

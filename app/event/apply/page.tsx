import { SlotState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ApplyContent } from "@/components/landing/apply-content";

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

function serializeSlot(s: {
  id: string;
  eventName: string;
  theme: string;
  instructor: string;
  capacity: number;
  applicationBegin: Date;
  applicationDeadline: Date;
  startsAt: Date;
  endsAt: Date;
  state: SlotState;
  venue: { name: string; address: string };
}): SlotData {
  return {
    id: s.id,
    eventName: s.eventName,
    theme: s.theme,
    instructor: s.instructor,
    capacity: s.capacity,
    applicationBegin: s.applicationBegin.toISOString(),
    applicationDeadline: s.applicationDeadline.toISOString(),
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    state: s.state,
    venue: s.venue,
  };
}

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ slots?: string }>;
}) {
  const { slots: slotsParam } = await searchParams;
  const preSelectedIds = slotsParam
    ? slotsParam.split(",").filter(Boolean)
    : [];

  const acceptingSlots = await prisma.slot.findMany({
    where: { state: SlotState.ACCEPTING_APPLICATIONS },
    include: { venue: { select: { name: true, address: true } } },
    orderBy: { startsAt: "asc" },
  });

  const selectedSlots = acceptingSlots
    .filter((s) => preSelectedIds.includes(s.id))
    .map(serializeSlot);

  const otherSlots = acceptingSlots
    .filter((s) => !preSelectedIds.includes(s.id))
    .map(serializeSlot);

  return (
    <main className="flex flex-col min-h-screen bg-warm-100 font-sans">
      <Header />
      <div className="flex flex-col flex-1">
        <ApplyContent
          initialSelectedSlots={selectedSlots}
          otherSlots={otherSlots}
        />
        <Footer />
      </div>
    </main>
  );
}

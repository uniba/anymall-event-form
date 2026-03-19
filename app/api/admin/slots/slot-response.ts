export function toSlotTableRow(slot: {
  id: string;
  eventName: string;
  venueId: string;
  venue: { name: string };
  theme: string;
  instructor: string;
  capacity: number;
  applicationBegin: Date;
  applicationDeadline: Date;
  lotteryResultTime: Date;
  startsAt: Date;
  endsAt: Date;
  state: "APPLICATIONS_CLOSED" | "ACCEPTING_APPLICATIONS";
}) {
  return {
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
  };
}

import { SlotState } from "@prisma/client";

export type SeedVenue = {
  id: string;
  name: string;
  address?: string;
};

export type SeedSlot = {
  id: string;
  venueId: SeedVenue["id"];
  theme: string;
  instructor: string;
  applicationBegin: string;
  applicationDeadline: string;
  startsAt: string;
  endsAt: string;
  state: SlotState;
};

export const seedVenues: SeedVenue[] = [
  {
    id: "seed-venue-tokyo-bayside",
    name: "Tokyo Bayside Studio",
    address: "1-8-1 Kaigan, Minato-ku, Tokyo"
  },
  {
    id: "seed-venue-shibuya-garden",
    name: "Shibuya Garden Terrace",
    address: "2-21-1 Shibuya, Shibuya-ku, Tokyo"
  },
  {
    id: "seed-venue-osaka-riverside",
    name: "Osaka Riverside Hall",
    address: "3-5-12 Nakanoshima, Kita-ku, Osaka"
  }
];

export const seedSlots: SeedSlot[] = [
  {
    id: "seed-slot-tokyo-bayside-apr-18-am",
    venueId: "seed-venue-tokyo-bayside",
    theme: "Spring Networking Lunch",
    instructor: "Aiko Tanaka",
    applicationBegin: "2026-03-20T00:00:00+09:00",
    applicationDeadline: "2026-04-12T23:59:59+09:00",
    startsAt: "2026-04-18T11:30:00+09:00",
    endsAt: "2026-04-18T13:00:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS
  },
  {
    id: "seed-slot-tokyo-bayside-apr-18-pm",
    venueId: "seed-venue-tokyo-bayside",
    theme: "Product Feedback Circle",
    instructor: "Ken Sato",
    applicationBegin: "2026-03-20T00:00:00+09:00",
    applicationDeadline: "2026-04-12T23:59:59+09:00",
    startsAt: "2026-04-18T14:30:00+09:00",
    endsAt: "2026-04-18T16:00:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS
  },
  {
    id: "seed-slot-shibuya-garden-apr-25",
    venueId: "seed-venue-shibuya-garden",
    theme: "Creator Meetup Lunch",
    instructor: "Mika Hayashi",
    applicationBegin: "2026-03-24T00:00:00+09:00",
    applicationDeadline: "2026-04-20T23:59:59+09:00",
    startsAt: "2026-04-25T12:00:00+09:00",
    endsAt: "2026-04-25T13:30:00+09:00",
    state: SlotState.ACCEPTING_APPLICATIONS
  },
  {
    id: "seed-slot-osaka-riverside-apr-11",
    venueId: "seed-venue-osaka-riverside",
    theme: "Community Lunch Pilot",
    instructor: "Ryo Nakamura",
    applicationBegin: "2026-03-15T00:00:00+09:00",
    applicationDeadline: "2026-04-05T23:59:59+09:00",
    startsAt: "2026-04-11T12:00:00+09:00",
    endsAt: "2026-04-11T13:30:00+09:00",
    state: SlotState.APPLICATIONS_CLOSED
  }
];

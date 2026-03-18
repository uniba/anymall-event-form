import { PrismaClient } from "@prisma/client";
import { seedSlots, seedVenues, type SeedSlot, type SeedVenue } from "./seed-data.ts";

const prisma = new PrismaClient();

function requireSafeEnvironment() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    throw new Error("Seeding is blocked in production unless ALLOW_PRODUCTION_SEED=true is set.");
  }
}

function toDate(value: string) {
  return new Date(value);
}

function createVenueInput(venue: SeedVenue) {
  return {
    name: venue.name,
    address: venue.address ?? null
  };
}

function createSlotInput(slot: SeedSlot) {
  return {
    venueId: slot.venueId,
    eventName: slot.eventName,
    theme: slot.theme,
    instructor: slot.instructor,
    capacity: slot.capacity,
    applicationBegin: toDate(slot.applicationBegin),
    applicationDeadline: toDate(slot.applicationDeadline),
    lotteryResultTime: toDate(slot.lotteryResultTime),
    startsAt: toDate(slot.startsAt),
    endsAt: toDate(slot.endsAt),
    state: slot.state
  };
}

async function seedVenuesTable() {
  for (const venue of seedVenues) {
    await prisma.venue.upsert({
      where: { id: venue.id },
      update: createVenueInput(venue),
      create: {
        id: venue.id,
        ...createVenueInput(venue)
      }
    });
  }
}

async function seedSlotsTable() {
  for (const slot of seedSlots) {
    await prisma.slot.upsert({
      where: { id: slot.id },
      update: createSlotInput(slot),
      create: {
        id: slot.id,
        ...createSlotInput(slot)
      }
    });
  }
}

async function main() {
  requireSafeEnvironment();

  await seedVenuesTable();
  await seedSlotsTable();

  console.log(`Seeded ${seedVenues.length} venues and ${seedSlots.length} slots.`);
}

main()
  .catch((error) => {
    console.error("Seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

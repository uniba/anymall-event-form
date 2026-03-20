import { PrismaClient } from "@prisma/client";
import {
  seedSlots,
  seedSubmissionSlots,
  seedSubmissions,
  seedVenues,
  type SeedSlot,
  type SeedSubmission,
  type SeedSubmissionSlot,
  type SeedVenue
} from "./seed-data-lottery.ts";

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
    address: venue.address ?? ""
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

function createSubmissionInput(submission: SeedSubmission) {
  return {
    name: submission.name,
    furigana: submission.furigana,
    email: submission.email,
    gender: submission.gender,
    birthday: submission.birthday ? toDate(submission.birthday) : undefined,
    prefecture: submission.prefecture,
    memo: submission.memo
  };
}

function createSubmissionSlotInput(submissionSlot: SeedSubmissionSlot) {
  return {
    submissionId: submissionSlot.submissionId,
    slotId: submissionSlot.slotId,
    submissionAttemptId: submissionSlot.submissionAttemptId,
    status: submissionSlot.status,
    appliedAt: submissionSlot.appliedAt ? toDate(submissionSlot.appliedAt) : undefined,
    receiptEmailSentAt: submissionSlot.receiptEmailSentAt
      ? toDate(submissionSlot.receiptEmailSentAt)
      : undefined,
    notes: submissionSlot.notes
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

async function seedSubmissionsTable() {
  for (const submission of seedSubmissions) {
    await prisma.submission.upsert({
      where: { id: submission.id },
      update: createSubmissionInput(submission),
      create: {
        id: submission.id,
        ...createSubmissionInput(submission)
      }
    });
  }
}

async function seedSubmissionSlotsTable() {
  for (const submissionSlot of seedSubmissionSlots) {
    await prisma.submissionSlot.upsert({
      where: {
        submissionId_slotId_submissionAttemptId: {
          submissionId: submissionSlot.submissionId,
          slotId: submissionSlot.slotId,
          submissionAttemptId: submissionSlot.submissionAttemptId
        }
      },
      update: createSubmissionSlotInput(submissionSlot),
      create: {
        id: submissionSlot.id,
        ...createSubmissionSlotInput(submissionSlot)
      }
    });
  }
}

async function main() {
  requireSafeEnvironment();

  await seedVenuesTable();
  await seedSlotsTable();
  await seedSubmissionsTable();
  await seedSubmissionSlotsTable();

  console.log(
    `Seeded ${seedVenues.length} venues, ${seedSlots.length} slots, ${seedSubmissions.length} submissions, and ${seedSubmissionSlots.length} submission slots.`
  );
}

main()
  .catch((error) => {
    console.error("Lottery seed failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

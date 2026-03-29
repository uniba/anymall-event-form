import { describe, it, expect, beforeAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { truncateAll } from "./helpers";

describe("truncateAll", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  });

  it("removes all rows from all tables", async () => {
    // Insert test data
    const venue = await prisma.venue.create({
      data: { name: "Test Venue", address: "Test Address" },
    });
    await prisma.slot.create({
      data: {
        venueId: venue.id,
        eventName: "Test Event",
        theme: "Test",
        instructor: "Test",
        capacity: 10,
        applicationBegin: new Date(),
        applicationDeadline: new Date(),
        lotteryResultTime: new Date(),
        startsAt: new Date(),
        endsAt: new Date(),
        state: "ACCEPTING_APPLICATIONS",
      },
    });

    // Truncate
    await truncateAll(prisma);

    // Verify empty
    const venues = await prisma.venue.findMany();
    const slots = await prisma.slot.findMany();
    const submissions = await prisma.submission.findMany();

    expect(venues).toHaveLength(0);
    expect(slots).toHaveLength(0);
    expect(submissions).toHaveLength(0);
  });
});

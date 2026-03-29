import type { PrismaClient } from "@prisma/client";

const TABLES = [
  "SubmissionSlot",
  "Submission",
  "Slot",
  "Venue",
] as const;

export async function truncateAll(prisma: PrismaClient): Promise<void> {
  for (const table of TABLES) {
    await (prisma[table as Uncapitalize<typeof table>] as any).deleteMany();
  }
}

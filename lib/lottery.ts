import { SlotApplicationStatus, SlotState, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LotteryRowResult = {
  id: string;
  submissionName: string;
  submissionEmail: string;
  status: "ACCEPTED" | "WAITLISTED";
};

export type LotteryRunResult = {
  slot: {
    id: string;
    venueName: string;
    startsAt: Date;
    endsAt: Date;
    state: SlotState;
  };
  eligibleCount: number;
  acceptedCount: number;
  waitlistedCount: number;
  accepted: LotteryRowResult[];
  waitlisted: LotteryRowResult[];
};

export class LotteryError extends Error {
  code: "SLOT_NOT_FOUND" | "SLOT_NOT_CLOSED";

  constructor(code: "SLOT_NOT_FOUND" | "SLOT_NOT_CLOSED", message: string) {
    super(message);
    this.code = code;
  }
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

export async function runSlotLottery(params: {
  targetSlotId: string;
  successCount: number;
  prismaClient?: PrismaClient;
}): Promise<LotteryRunResult> {
  const { targetSlotId, successCount, prismaClient = prisma } = params;

  return prismaClient.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({
      where: {
        id: targetSlotId
      },
      include: {
        venue: {
          select: {
            name: true
          }
        }
      }
    });

    if (!slot) {
      throw new LotteryError("SLOT_NOT_FOUND", "Selected slot does not exist.");
    }

    if (slot.state !== SlotState.APPLICATIONS_CLOSED) {
      throw new LotteryError("SLOT_NOT_CLOSED", "Lottery can only run for APPLICATIONS_CLOSED slots.");
    }

    const eligibleApplications = await tx.submissionSlot.findMany({
      where: {
        slotId: targetSlotId,
        status: {
          in: ["APPLIED", "WAITLISTED"],
        },
        submission: {
          slotApplications: {
            none: {
              status: SlotApplicationStatus.ACCEPTED
            }
          }
        }
      },
      include: {
        submission: {
          select: {
            name: true,
            email: true
          }
        },
        slot: {
          include: {
            venue: true
          }
        }
      }
    });

    const shuffled = shuffleArray(eligibleApplications);
    const acceptedCount = Math.min(successCount, shuffled.length);
    const acceptedRows = shuffled.slice(0, acceptedCount);
    const waitlistedRows = shuffled.slice(acceptedCount);

    if (acceptedRows.length > 0) {
      await tx.submissionSlot.updateMany({
        where: {
          id: {
            in: acceptedRows.map((row) => row.id)
          },
          status: {
            in: [SlotApplicationStatus.APPLIED, SlotApplicationStatus.WAITLISTED],
          }
        },
        data: {
          status: SlotApplicationStatus.ACCEPTED
        }
      });
    }

    if (waitlistedRows.length > 0) {
      await tx.submissionSlot.updateMany({
        where: {
          id: {
            in: waitlistedRows.map((row) => row.id)
          },
          status: {
            in: [SlotApplicationStatus.APPLIED, SlotApplicationStatus.WAITLISTED],
          }
        },
        data: {
          status: SlotApplicationStatus.WAITLISTED
        }
      });
    }

    const toResultRow = (
      row: (typeof shuffled)[number],
      status: "ACCEPTED" | "WAITLISTED"
    ): LotteryRowResult => ({
      id: row.id,
      submissionName: row.submission.name,
      submissionEmail: row.submission.email,
      status
    });

    return {
      slot: {
        id: slot.id,
        venueName: slot.venue.name,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        state: slot.state
      },
      eligibleCount: shuffled.length,
      acceptedCount: acceptedRows.length,
      waitlistedCount: waitlistedRows.length,
      accepted: acceptedRows.map((row) => toResultRow(row, SlotApplicationStatus.ACCEPTED)),
      waitlisted: waitlistedRows.map((row) => toResultRow(row, SlotApplicationStatus.WAITLISTED))
    };
  });
}

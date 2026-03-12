-- AlterTable
ALTER TABLE "SubmissionSlot"
ADD COLUMN "submissionAttemptId" TEXT NOT NULL DEFAULT 'legacy';

-- DropIndex
DROP INDEX IF EXISTS "SubmissionSlot_submissionId_slotId_key";

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionSlot_submissionId_slotId_submissionAttemptId_key"
ON "SubmissionSlot"("submissionId", "slotId", "submissionAttemptId");

-- CreateIndex
CREATE INDEX "SubmissionSlot_submissionId_submissionAttemptId_idx"
ON "SubmissionSlot"("submissionId", "submissionAttemptId");

-- AlterTable
ALTER TABLE "SubmissionSlot"
ALTER COLUMN "submissionAttemptId" DROP DEFAULT;

-- DropIndex
DROP INDEX IF EXISTS "SubmissionSlot_submissionId_preferenceRank_key";

-- AlterTable
ALTER TABLE "SubmissionSlot" DROP COLUMN IF EXISTS "preferenceRank";

/*
  Warnings:

  - A unique constraint covering the columns `[submissionId,preferenceRank]` on the table `SubmissionSlot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `preferenceRank` to the `SubmissionSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubmissionSlot" ADD COLUMN     "preferenceRank" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionSlot_submissionId_preferenceRank_key" ON "SubmissionSlot"("submissionId", "preferenceRank");

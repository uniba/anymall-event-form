/*
  Warnings:

  - Added the required column `furigana` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add furigana column with default value temporarily
ALTER TABLE "Submission" ADD COLUMN "furigana" TEXT NOT NULL DEFAULT '';

-- Update existing rows: copy name to furigana (existing data has katakana in name field)
UPDATE "Submission" SET "furigana" = "name" WHERE "furigana" = '';

-- Remove default constraint
ALTER TABLE "Submission" ALTER COLUMN "furigana" DROP DEFAULT;

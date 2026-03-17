-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'UNSPECIFIED');

-- AlterTable
ALTER TABLE "Submission"
ADD COLUMN "gender_new" "Gender" NOT NULL DEFAULT 'UNSPECIFIED';

-- MigrateData
UPDATE "Submission"
SET "gender_new" = CASE
  WHEN LOWER(TRIM("gender")) = 'male' THEN 'MALE'::"Gender"
  WHEN LOWER(TRIM("gender")) = 'female' THEN 'FEMALE'::"Gender"
  ELSE 'UNSPECIFIED'::"Gender"
END;

-- SwapColumns
ALTER TABLE "Submission" DROP COLUMN "gender";
ALTER TABLE "Submission" RENAME COLUMN "gender_new" TO "gender";
ALTER TABLE "Submission" ALTER COLUMN "gender" DROP DEFAULT;

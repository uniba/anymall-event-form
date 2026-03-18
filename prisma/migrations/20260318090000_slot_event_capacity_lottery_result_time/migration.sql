-- AlterTable
ALTER TABLE "Slot"
ADD COLUMN "eventName" TEXT NOT NULL DEFAULT '未設定イベント',
ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lotteryResultTime" TIMESTAMP(3);

-- Backfill
UPDATE "Slot"
SET "lotteryResultTime" = "startsAt"
WHERE "lotteryResultTime" IS NULL;

-- EnforceRequired
ALTER TABLE "Slot"
ALTER COLUMN "lotteryResultTime" SET NOT NULL;

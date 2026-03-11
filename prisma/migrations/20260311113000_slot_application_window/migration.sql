-- AlterTable
ALTER TABLE "Slot"
ADD COLUMN     "applicationBegin" TIMESTAMP(3),
ADD COLUMN     "applicationDeadline" TIMESTAMP(3);

-- Backfill existing rows using slot time as a safe default.
UPDATE "Slot"
SET
  "applicationBegin" = "startsAt",
  "applicationDeadline" = "endsAt"
WHERE
  "applicationBegin" IS NULL
  OR "applicationDeadline" IS NULL;

-- Enforce required columns after backfill.
ALTER TABLE "Slot"
ALTER COLUMN "applicationBegin" SET NOT NULL,
ALTER COLUMN "applicationDeadline" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Slot_state_applicationBegin_applicationDeadline_idx"
ON "Slot"("state", "applicationBegin", "applicationDeadline");

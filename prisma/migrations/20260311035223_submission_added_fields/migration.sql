/*
  Warnings:

  - You are about to drop the column `lineId` on the `Submission` table. All the data in the column will be lost.
  - Added the required column `birthday` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Submission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "lineId",
ADD COLUMN     "birthday" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

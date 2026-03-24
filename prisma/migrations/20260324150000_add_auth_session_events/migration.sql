-- CreateEnum
CREATE TYPE "AuthSessionEventType" AS ENUM ('SIGN_IN', 'SIGN_OUT', 'SESSION_EXPIRED');

-- CreateTable
CREATE TABLE "AuthSessionEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventType" "AuthSessionEventType" NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSessionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthSessionEvent_userId_createdAt_idx" ON "AuthSessionEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthSessionEvent_sessionId_createdAt_idx" ON "AuthSessionEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AuthSessionEvent_eventType_createdAt_idx" ON "AuthSessionEvent"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "AuthSessionEvent" ADD CONSTRAINT "AuthSessionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

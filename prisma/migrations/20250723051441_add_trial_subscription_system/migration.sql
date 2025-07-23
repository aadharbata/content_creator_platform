-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN     "subscriptionType" TEXT NOT NULL DEFAULT 'paid',
ADD COLUMN     "trialDuration" INTEGER;

-- CreateTable
CREATE TABLE "TrialSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrialSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrialSubscription_userId_creatorId_expiresAt_idx" ON "TrialSubscription"("userId", "creatorId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrialSubscription_userId_creatorId_key" ON "TrialSubscription"("userId", "creatorId");

-- AddForeignKey
ALTER TABLE "TrialSubscription" ADD CONSTRAINT "TrialSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialSubscription" ADD CONSTRAINT "TrialSubscription_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

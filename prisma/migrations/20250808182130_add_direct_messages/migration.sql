/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Product` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- AlterTable
ALTER TABLE "CreatorProfile" ALTER COLUMN "subscriptionType" SET DEFAULT 'free';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "categoryId",
ADD COLUMN     "images" TEXT[];

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DirectMessage_roomId_createdAt_idx" ON "DirectMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "DirectMessage_senderId_idx" ON "DirectMessage"("senderId");

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

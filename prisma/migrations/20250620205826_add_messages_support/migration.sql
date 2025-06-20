/*
  Warnings:

  - Added the required column `rating` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('QUESTION', 'FEEDBACK', 'SUPPORT', 'GENERAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ContentType" ADD VALUE 'TEMPLATE';
ALTER TYPE "ContentType" ADD VALUE 'SOFTWARE';
ALTER TYPE "ContentType" ADD VALUE 'EBOOK';
ALTER TYPE "ContentType" ADD VALUE 'AUDIO';
ALTER TYPE "ContentType" ADD VALUE 'IMAGE';
ALTER TYPE "ContentType" ADD VALUE 'OTHER';

-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_courseId_fkey";

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "demoLink" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "tags" TEXT,
ALTER COLUMN "courseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'GENERAL',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "courseId" TEXT,
    "parentMessageId" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_receiverId_isRead_createdAt_idx" ON "Message"("receiverId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_courseId_idx" ON "Message"("courseId");

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

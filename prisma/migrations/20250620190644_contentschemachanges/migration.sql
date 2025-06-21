/*
  Warnings:

  - Added the required column `rating` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
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

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

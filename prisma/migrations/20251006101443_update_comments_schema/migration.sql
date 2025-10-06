/*
  Warnings:

  - You are about to drop the column `author_name` on the `comments` table. All the data in the column will be lost.
  - Added the required column `author` to the `comments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "comments" DROP COLUMN "author_name",
ADD COLUMN     "author" TEXT NOT NULL,
ADD COLUMN     "drawing_data" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'comment';

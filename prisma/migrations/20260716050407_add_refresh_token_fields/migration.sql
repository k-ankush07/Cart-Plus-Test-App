/*
  Warnings:

  - You are about to drop the `ShopPlan` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "Session" ADD COLUMN "refreshTokenExpires" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ShopPlan";
PRAGMA foreign_keys=on;

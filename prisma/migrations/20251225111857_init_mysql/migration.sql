/*
  Warnings:

  - You are about to drop the column `doc` on the `seoglobal` table. All the data in the column will be lost.
  - You are about to drop the column `siteKey` on the `seoglobal` table. All the data in the column will be lost.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - A unique constraint covering the columns `[key]` on the table `SeoGlobal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `data` to the `SeoGlobal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `SeoGlobal` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `SeoGlobal_siteKey_key` ON `seoglobal`;

-- AlterTable
ALTER TABLE `seoglobal` DROP COLUMN `doc`,
    DROP COLUMN `siteKey`,
    ADD COLUMN `data` JSON NOT NULL,
    ADD COLUMN `key` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP PRIMARY KEY,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `SeoGlobal_key_key` ON `SeoGlobal`(`key`);

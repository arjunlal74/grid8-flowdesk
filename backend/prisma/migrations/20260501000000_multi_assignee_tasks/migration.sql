-- CreateTable
CREATE TABLE `TaskAssignee` (
    `taskId` INTEGER NOT NULL,
    `employeeId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TaskAssignee_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`taskId`, `employeeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Migrate existing single-assignee data into the new join table
INSERT INTO `TaskAssignee` (`taskId`, `employeeId`)
SELECT `id`, `assigneeId` FROM `Task` WHERE `assigneeId` IS NOT NULL;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_assigneeId_fkey`;

-- DropColumn
ALTER TABLE `Task` DROP COLUMN `assigneeId`;

-- AddForeignKey
ALTER TABLE `TaskAssignee` ADD CONSTRAINT `TaskAssignee_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskAssignee` ADD CONSTRAINT `TaskAssignee_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

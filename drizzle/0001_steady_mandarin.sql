CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`salonId` int,
	`action` varchar(255) NOT NULL,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salonId` int NOT NULL,
	`dailyReminder` boolean NOT NULL DEFAULT true,
	`inactivityAlert` boolean NOT NULL DEFAULT true,
	`reportNotification` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationSettings_salonId_unique` UNIQUE(`salonId`)
);
--> statement-breakpoint
CREATE TABLE `reportExports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`format` enum('pdf','excel','word') NOT NULL,
	`fileUrl` varchar(512) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportExports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salonId` int NOT NULL,
	`generatedBy` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`totalEncaissements` decimal(12,2) NOT NULL,
	`totalDecaissements` decimal(12,2) NOT NULL,
	`finalBalance` decimal(12,2) NOT NULL,
	`encaissementsBreakdown` json,
	`decaissementsBreakdown` json,
	`momentumData` json,
	`encaissementsInterpretation` longtext,
	`decaissementsInterpretation` longtext,
	`momentumInterpretation` longtext,
	`personalizedAdvice` longtext,
	`adminComments` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `salons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`managerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `salons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`salonId` int NOT NULL,
	`type` enum('encaissement','decaissement') NOT NULL,
	`designation` varchar(255) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`comment` text,
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','manager') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);
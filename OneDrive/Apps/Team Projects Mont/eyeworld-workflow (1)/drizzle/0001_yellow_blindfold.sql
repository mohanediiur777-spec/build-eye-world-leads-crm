CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`storageKey` varchar(500) NOT NULL,
	`storageUrl` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` longtext NOT NULL,
	`parentCommentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('status_change','new_request','comment_mention','comment_reply') NOT NULL,
	`requestId` int,
	`title` varchar(255) NOT NULL,
	`message` longtext,
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext,
	`materialType` varchar(100) NOT NULL,
	`targetAudience` varchar(255),
	`deadline` timestamp,
	`status` enum('Pending','In Review','Approved','Rejected') NOT NULL DEFAULT 'Pending',
	`submitterId` int NOT NULL,
	`assignedReviewerId` int,
	`rejectionReason` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `statusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`oldStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`changedBy` int NOT NULL,
	`reason` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `statusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','reviewer') NOT NULL DEFAULT 'user';
CREATE TABLE `book` (
	`id` text PRIMARY KEY NOT NULL,
	`library_id` text NOT NULL,
	`type` text NOT NULL,
	`path` text NOT NULL,
	`audios` text DEFAULT '[]' NOT NULL,
	`mtime` integer NOT NULL,
	`size` integer NOT NULL,
	`title` text NOT NULL,
	`author` text,
	`narrator` text,
	`isbn` text,
	`description` text,
	`cover_path` text,
	`duration` integer,
	`word_count` integer,
	`tags` text DEFAULT '[]' NOT NULL,
	`genre` text DEFAULT '[]' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `book_path_unique` ON `book` (`path`);--> statement-breakpoint
CREATE TABLE `library_folder` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`library_id` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `library` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`last_scan` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `library_name_unique` ON `library` (`name`);--> statement-breakpoint
CREATE TABLE `media_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`book_id` text NOT NULL,
	`progress` real DEFAULT 0 NOT NULL,
	`position` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`target_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`result` text,
	`started_at` integer,
	`completed_at` integer,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`token` text NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`image` text,
	`permissions` text DEFAULT '{}' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "role_check" CHECK("user"."role" IN ('admin', 'user'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);
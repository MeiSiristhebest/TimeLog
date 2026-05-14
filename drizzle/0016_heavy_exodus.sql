CREATE TABLE `daily_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`date_key` text NOT NULL,
	`goal_duration_ms` integer NOT NULL,
	`completed_duration_ms` integer DEFAULT 0 NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

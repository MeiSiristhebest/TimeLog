CREATE TABLE `local_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text,
	`birth_date` text,
	`language` text,
	`font_scale_index` integer,
	`avatar_uri` text,
	`avatar_url` text,
	`role` text DEFAULT 'storyteller',
	`is_anonymous` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transcript_segments` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`segment_index` integer NOT NULL,
	`speaker` text NOT NULL,
	`text` text NOT NULL,
	`confidence` real,
	`start_time_ms` integer,
	`end_time_ms` integer,
	`is_final` integer NOT NULL,
	`synced_at` integer,
	`created_at` integer NOT NULL
);

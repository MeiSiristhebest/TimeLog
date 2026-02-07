CREATE TABLE `family_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`senior_user_id` text NOT NULL,
	`family_user_id` text NOT NULL,
	`question_text` text NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`created_at` integer NOT NULL,
	`answered_at` integer,
	`recording_id` text,
	`synced_at` integer
);
--> statement-breakpoint
CREATE INDEX `family_questions_senior_unanswered_idx` ON `family_questions` (`senior_user_id`,`answered_at`);--> statement-breakpoint
CREATE INDEX `family_questions_category_idx` ON `family_questions` (`category`);--> statement-breakpoint
CREATE TABLE `dialog_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`story_id` text NOT NULL,
	`livekit_room_name` text,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`mode` text NOT NULL,
	`skip_count` integer DEFAULT 0 NOT NULL,
	`timeout_count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `network_quality_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text,
	`timestamp` integer NOT NULL,
	`rtt_ms` integer NOT NULL,
	`packet_loss_percent` real NOT NULL,
	`jitter_ms` integer NOT NULL,
	`quality_score` text NOT NULL
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
	`is_final` integer DEFAULT false NOT NULL,
	`synced_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `audio_recordings` ADD `transcription` text;--> statement-breakpoint
ALTER TABLE `audio_recordings` ADD `cover_image_path` text;
CREATE TABLE `audio_recordings` (
	`id` text PRIMARY KEY NOT NULL,
	`file_path` text NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`size_bytes` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`is_synced` integer DEFAULT 0 NOT NULL,
	`checksum_md5` text,
	`topic_id` text,
	`user_id` text,
	`device_id` text
);

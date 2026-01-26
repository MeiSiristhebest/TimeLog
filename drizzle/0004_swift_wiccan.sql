ALTER TABLE `audio_recordings`
    ADD `is_synced` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sync_queue`
    ADD `priority` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `sync_queue`
    ADD `file_path` text;
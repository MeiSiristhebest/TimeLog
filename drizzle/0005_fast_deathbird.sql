ALTER TABLE `audio_recordings`
    ADD `recording_status` text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE `audio_recordings`
    ADD `paused_at` integer;
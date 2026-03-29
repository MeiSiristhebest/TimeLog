ALTER TABLE `audio_recordings` ADD `is_favorite` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `audio_recordings` ADD `family_question_id` text;--> statement-breakpoint
ALTER TABLE `audio_recordings` ADD `unlock_at` integer;
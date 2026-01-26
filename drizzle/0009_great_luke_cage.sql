CREATE TABLE `activity_events`
(
    `id`             text PRIMARY KEY NOT NULL,
    `type`           text             NOT NULL,
    `story_id`       text             NOT NULL,
    `actor_user_id`  text             NOT NULL,
    `target_user_id` text             NOT NULL,
    `metadata`       text,
    `created_at`     integer          NOT NULL,
    `read_at`        integer,
    `synced_at`      integer,
    FOREIGN KEY (`story_id`) REFERENCES `audio_recordings` (`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `activity_events_unread_idx` ON `activity_events` (`target_user_id`, `read_at`);--> statement-breakpoint
CREATE INDEX `activity_events_story_idx` ON `activity_events` (`story_id`);
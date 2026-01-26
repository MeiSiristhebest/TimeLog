CREATE TABLE `sync_queue`
(
    `id`            text PRIMARY KEY          NOT NULL,
    `type`          text                      NOT NULL,
    `recording_id`  text,
    `payload`       text                      NOT NULL,
    `created_at`    integer                   NOT NULL,
    `retry_count`   integer DEFAULT 0         NOT NULL,
    `status`        text    DEFAULT 'pending' NOT NULL,
    `last_error`    text,
    `next_retry_at` integer
);
--> statement-breakpoint
ALTER TABLE `audio_recordings` DROP COLUMN `is_synced`;
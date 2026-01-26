PRAGMA
foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_audio_recordings`
(
    `id`           text PRIMARY KEY        NOT NULL,
    `file_path`    text                    NOT NULL,
    `duration_ms`  integer DEFAULT 0       NOT NULL,
    `size_bytes`   integer DEFAULT 0       NOT NULL,
    `started_at`   integer                 NOT NULL,
    `ended_at`     integer,
    `is_synced`    integer DEFAULT false   NOT NULL,
    `sync_status`  text    DEFAULT 'local' NOT NULL,
    `checksum_md5` text,
    `topic_id`     text,
    `user_id`      text,
    `device_id`    text
);
--> statement-breakpoint
INSERT INTO `__new_audio_recordings`("id", "file_path", "duration_ms", "size_bytes", "started_at", "ended_at",
                                     "is_synced", "sync_status", "checksum_md5", "topic_id", "user_id", "device_id")
SELECT "id",
       "file_path",
       "duration_ms",
       "size_bytes",
       "started_at",
       "ended_at",
       "is_synced",
       "sync_status",
       "checksum_md5",
       "topic_id",
       "user_id",
       "device_id"
FROM `audio_recordings`;--> statement-breakpoint
DROP TABLE `audio_recordings`;--> statement-breakpoint
ALTER TABLE `__new_audio_recordings` RENAME TO `audio_recordings`;--> statement-breakpoint
PRAGMA
foreign_keys=ON;
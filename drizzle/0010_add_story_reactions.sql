CREATE TABLE `story_reactions`
(
    `id`            text PRIMARY KEY     NOT NULL,
    `story_id`      text                 NOT NULL,
    `user_id`       text                 NOT NULL,
    `reaction_type` text DEFAULT 'heart' NOT NULL,
    `created_at`    integer              NOT NULL,
    `synced_at`     integer,
    FOREIGN KEY (`story_id`) REFERENCES `audio_recordings` (`id`) ON UPDATE no action ON DELETE cascade
);

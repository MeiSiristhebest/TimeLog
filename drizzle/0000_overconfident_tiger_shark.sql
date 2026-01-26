CREATE TABLE `app_settings`
(
    `id`            text PRIMARY KEY NOT NULL,
    `setting_key`   text             NOT NULL,
    `setting_value` text,
    `created_at`    integer          NOT NULL
);

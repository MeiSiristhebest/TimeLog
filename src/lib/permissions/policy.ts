export const PERMISSION_CONTEXT = {
  RECORDER_START: 'recorder.start',
  NOTIFICATION_PROMPT: 'notifications.prompt',
  NOTIFICATION_SETTINGS: 'notifications.settings',
  PROFILE_AVATAR_PICKER: 'profile.avatar-picker',
} as const;

export type PermissionContext = (typeof PERMISSION_CONTEXT)[keyof typeof PERMISSION_CONTEXT];

export const PERMISSION_KIND = {
  MICROPHONE: 'microphone',
  NOTIFICATIONS: 'notifications',
  MEDIA_LIBRARY: 'mediaLibrary',
} as const;

export type PermissionKind = (typeof PERMISSION_KIND)[keyof typeof PERMISSION_KIND];

const PERMISSION_POLICY: Record<PermissionKind, readonly PermissionContext[]> = {
  [PERMISSION_KIND.MICROPHONE]: [PERMISSION_CONTEXT.RECORDER_START],
  [PERMISSION_KIND.NOTIFICATIONS]: [
    PERMISSION_CONTEXT.NOTIFICATION_PROMPT,
    PERMISSION_CONTEXT.NOTIFICATION_SETTINGS,
  ],
  [PERMISSION_KIND.MEDIA_LIBRARY]: [PERMISSION_CONTEXT.PROFILE_AVATAR_PICKER],
};

export const MINIMAL_ANDROID_PERMISSIONS = ['android.permission.RECORD_AUDIO'] as const;

export function isPermissionRequestAllowed(
  kind: PermissionKind,
  context: PermissionContext
): boolean {
  return PERMISSION_POLICY[kind].includes(context);
}

export function assertPermissionRequestAllowed(
  kind: PermissionKind,
  context: PermissionContext
): void {
  if (isPermissionRequestAllowed(kind, context)) {
    return;
  }

  throw new Error(`[Permissions] ${kind} request is not allowed from context "${context}"`);
}

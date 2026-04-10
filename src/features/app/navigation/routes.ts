import type { Href } from 'expo-router';

export const APP_ROUTES = {
  ROOT: '/',
  SPLASH: '/splash',
  TABS: '/(tabs)',
  GALLERY: '/(tabs)/gallery',
  SETTINGS: '/(tabs)/settings',
  SETTINGS_APP_SETTINGS: '/(tabs)/settings/app-settings',
  SETTINGS_ACCOUNT_SECURITY: '/(tabs)/settings/account-security',
  SETTINGS_DISPLAY_ACCESSIBILITY: '/(tabs)/settings/display-accessibility',
  SETTINGS_DATA_STORAGE: '/(tabs)/settings/data-storage',
  SETTINGS_ABOUT_HELP: '/(tabs)/settings/about-help',
  SETTINGS_ABOUT_TIMELOG: '/(tabs)/settings/about-timelog',
  SETTINGS_EDIT_PROFILE: '/(tabs)/settings/edit-profile',
  SETTINGS_DELETED_ITEMS: '/(tabs)/settings/deleted-items',
  LOGIN: '/login',
  DEVICE_CODE: '/device-code',
  WELCOME: '/welcome',
  HELP: '/help',
  UPGRADE_ACCOUNT: '/upgrade-account',
} as const satisfies Record<string, Href>;

export function toStoryRoute(storyId: string): Href {
  return `/story/${storyId}` as Href;
}

export function toStoryEditRoute(storyId: string): Href {
  return `/story/edit?id=${encodeURIComponent(storyId)}` as Href;
}

export function toStoryCommentsRoute(storyId: string): Href {
  return `/story/comments?id=${encodeURIComponent(storyId)}` as Href;
}

export function toStoryReadOnlyDeletedRoute(storyId: string): Href {
  const id = encodeURIComponent(storyId);
  return `/story/${id}?readOnlyDeletedPreview=1` as Href;
}

export function toUpgradeAccountRoute(nextRoute: string): Href {
  const next = encodeURIComponent(nextRoute);
  return `${APP_ROUTES.UPGRADE_ACCOUNT}?next=${next}` as Href;
}

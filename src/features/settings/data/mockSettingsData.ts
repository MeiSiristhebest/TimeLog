/**
 * Mock Data for Settings Feature
 * Adhering to reactcomponents skill
 */

import { Ionicons } from '@/components/ui/Icon';

export const SETTINGS_STRINGS = {
  header: {
    title: 'Settings',
  },
  sections: {
    account: 'Account',
    preferences: 'Preferences',
    storage: 'Storage',
    about: 'About & Help',
  },
  items: {
    account: {
      security: 'Account & Security',
    },
    preferences: {
      display: 'Display & Accessibility',
    },
    storage: {
      data: 'Data & Storage',
    },
    about: {
      help: 'About & Help',
    },
  },
  home: {
    myStories: 'My Stories',
    favorites: 'Favorites',
  },
  appSettings: {
    title: 'Settings',
    sections: {
      account: 'ACCOUNT',
      general: 'GENERAL',
      about: 'ABOUT',
    },
    items: {
      accountSecurity: 'Account & Security',
      display: 'Display & Accessibility',
      dataStorage: 'Data & Storage',
      help: 'Help & Feedback',
      about: 'About TimeLog',
      switchAccount: 'Switch Account',
      logOut: 'Log Out',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
  },
  display: {
    title: 'Interface & Display',
    darkMode: 'Dark Mode',
    landscape: 'Landscape Mode',
    fontSize: 'Font Size',
    language: 'Multi-language',
    translate: 'Translate',
  },
  fontSize: {
    title: 'Font Size',
    preview: [
      { id: 1, type: 'received', text: 'This text size affects chat messages.' },
      { id: 2, type: 'sent', text: 'And also story descriptions!' },
      { id: 3, type: 'received', text: 'Adjust the slider below to find your preference.' },
    ],
    hint: 'Standard size is recommended.',
  },
  theme: {
    title: 'Dark Mode',
    options: [
      { label: 'Light Mode', value: 'light' },
      { label: 'Dark Mode', value: 'dark' },
      { label: 'Follow System', value: 'system' },
    ],
  },

  accountSecurity: {
    title: 'Account & Security',
    loading: 'Loading profile details...',
    sections: {
      profile: {
        editProfile: 'Edit Profile',
        role: 'My Role',
      },
      security: {
        recoveryCode: 'Recovery Code',
        deviceCode: 'Device Code',
        deviceManagement: 'Device Management',
      },
      signOut: {
        label: 'Sign Out',
      },
      deleteAccount: {
        label: 'Delete Account',
      },
    },
  },
  dataStorage: {
    title: 'Data & Storage',
    cloudProcessing: {
      title: 'Cloud Processing',
      label: 'Cloud AI Processing',
      caption:
        'Enable cloud processing for advanced AI features. Local-first recording still works offline.',
      errorTitle: 'Update Failed',
      errorMessage: 'Unable to save your setting.',
    },
    storage: {
      title: 'Storage',
      deletedItems: 'Deleted Items',
    },
  },
  aboutHelp: {
    title: 'About & Help',
    support: {
      title: 'Support',
      helpCenter: 'Help Center',
      contactSupport: 'Contact Support',
      emailNotAvailableTitle: 'Email Not Available',
      emailNotAvailableMessage: 'Unable to open your email app. Please try again later.',
      contactFailedTitle: 'Contact Failed',
      contactFailedMessage: 'Unable to open email right now.',
    },
    about: {
      title: 'About',
      appVersion: 'App Version',
    },
    supportEmail: 'support@timelog.app',
  },
  displayAccessibility: {
    title: 'Display & Accessibility',
    sections: {
      appearance: 'Appearance',
      textSize: 'Text Size',
      reset: 'Reset to Defaults',
    },
    labels: {
      fontSize: 'Font Size',
      preview: 'Preview',
      reset: 'Reset to Defaults',
    },
    previewText: 'Sample text: record life stories with comfort.',
    themeOptions: {
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
  },
} as const;

export type SettingsLinkData = {
  id: string;
  label: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: 'sageGreen' | 'amberCustom' | 'blueAccent' | 'primary' | 'textMuted'; // Semantic color keys
  summaryKey?: string; // Optional key to fetch dynamic summary
};

export const SETTINGS_STRUCTURE = [
  // Group 1: Account
  {
    id: 'group_account',
    title: SETTINGS_STRINGS.sections.account,
    rows: [
      {
        id: 'acc_security',
        label: SETTINGS_STRINGS.items.account.security,
        route: '/(tabs)/settings/account-security',
        icon: 'shield-checkmark-outline' as const,
        colorKey: 'sageGreen',
      },
    ] as SettingsLinkData[],
  },
  // Group 2: Preferences
  {
    id: 'group_preferences',
    title: SETTINGS_STRINGS.sections.preferences,
    rows: [
      {
        id: 'pref_display',
        label: SETTINGS_STRINGS.items.preferences.display,
        route: '/(tabs)/settings/display-accessibility',
        icon: 'text-outline' as const,
        colorKey: 'blueAccent',
        summaryKey: 'display',
      },
    ] as SettingsLinkData[],
  },
  // Group 3: Storage
  {
    id: 'group_storage',
    title: SETTINGS_STRINGS.sections.storage,
    rows: [
      {
        id: 'storage_data',
        label: SETTINGS_STRINGS.items.storage.data,
        route: '/(tabs)/settings/data-storage',
        icon: 'server-outline' as const,
        colorKey: 'textMuted',
        summaryKey: 'storage',
      },
    ] as SettingsLinkData[],
  },
  // Group 4: About
  {
    id: 'group_about',
    title: SETTINGS_STRINGS.sections.about,
    rows: [
      {
        id: 'about_help',
        label: SETTINGS_STRINGS.items.about.help,
        route: '/help',
        icon: 'help-circle-outline' as const,
        colorKey: 'textMuted',
      },
    ] as SettingsLinkData[],
  },
];

export const THEME_OPTIONS_DATA = [
  {
    label: SETTINGS_STRINGS.displayAccessibility.themeOptions.system,
    value: 'system' as const,
    icon: 'phone-portrait-outline' as const,
  },
  {
    label: SETTINGS_STRINGS.displayAccessibility.themeOptions.light,
    value: 'light' as const,
    icon: 'sunny-outline' as const,
  },
  {
    label: SETTINGS_STRINGS.displayAccessibility.themeOptions.dark,
    value: 'dark' as const,
    icon: 'moon-outline' as const,
  },
] as const;

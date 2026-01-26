/**
 * Mock Data for Auth & Security Features
 */

import { MaterialIcons } from '@expo/vector-icons';

export const AUTH_STRINGS = {
  role: {
    loading: 'Loading…',
    title: 'Who is using\nthis phone?',
    storyteller: {
      label: 'I am a Storyteller',
      title: 'I am a Storyteller',
      subtitle: 'I want to record memories',
      accessibilityLabel: 'I am a Storyteller',
    },
    listener: {
      label: 'I am a Listener',
      title: 'I am a Listener',
      subtitle: 'I want to hear stories',
      accessibilityLabel: 'I am a Listener',
    },
    backAccessibility: 'Go back',
  },
  recoveryCode: {
    title: 'Recovery Code',
    infoTitle: 'Device Recovery',
    infoText:
      "This code can be used to restore access to the senior's TimeLog account if their device is lost, stolen, or replaced.",
    codeLabel: 'RECOVERY CODE',
    noCode: 'No recovery code generated yet.',
    generateButton: {
      idle: 'Generate New Code',
      generating: 'Generating...',
    },
    warning:
      "Keep this code secure. Anyone with this code can potentially access the senior's account.",
    alerts: {
      generate: {
        title: 'Generate New Code?',
        message: 'This will invalidate the previous recovery code.',
        confirm: 'Generate',
        cancel: 'Cancel',
      },
      share: {
        message:
          "TimeLog Recovery Code: {code}\n\nUse this code to restore access to the senior's device if it's lost or replaced.",
      },
    },
    toast: 'Code copied to clipboard',
  },
  deviceCode: {
    title: 'Connect Device',
    headline: 'Connect with\nFamily',
    codeLabel: 'YOUR CODE',
    helperText: 'Share this code with your family.',
    readyButton: "I'm Ready",
    regenerate: {
      idle: 'Regenerate Code',
      loading: 'Generating...',
    },
    error: 'Error generating code',
    defaultError: 'Unable to generate code right now.',
  },
  deviceManagement: {
    title: 'Device Management',
    header: {
      title: 'Device Management',
      subtitle:
        'Generate a 6-digit code to link a senior device. Revocation applies on next heartbeat check.',
    },
    generateBox: {
      title: 'Generate device code',
      button: {
        idle: 'Generate code',
        loading: 'Generating…',
      },
      expires: 'Expires: {time}',
    },
    linkedDevices: 'Linked devices',
    emptyList: 'No devices yet.',
    revokeButton: 'Revoke Access',
    alerts: {
      codeReady: {
        title: 'Code Ready!',
        message: 'Your device code is {code}\n\nExpires at {time}',
      },
      revoked: {
        title: 'Device Revoked',
        message: 'Device will be logged out on next sync.',
      },
      error: {
        generate: 'Unable to generate code.',
        revoke: 'Unable to revoke device.',
        load: 'Unable to load devices.',
      },
    },
  },
  consentReview: {
    title: 'Review Consent',
    header: 'Your Privacy Choices',
    subheader:
      "These are the features you've consented to. You can change these settings anytime in Privacy & Sharing.",
    infoBox:
      'To withdraw consent, go to Settings → Privacy & Sharing and toggle off the relevant features.',
  },
} as const;

export type ConsentItem = {
  id: string;
  title: string;
  description: string;
  consentedAt: string;
  icon: keyof typeof MaterialIcons.glyphMap;
};

export const MOCK_CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'cloud_ai',
    title: 'Cloud AI Processing',
    description:
      'Short audio clips are sent to our AI service to generate follow-up questions and transcripts. Full recordings remain local first.',
    consentedAt: '2026-01-15',
    icon: 'psychology',
  },
  {
    id: 'cloud_storage',
    title: 'Cloud Storage',
    description:
      'Your stories are backed up to secure cloud storage for safekeeping and family access.',
    consentedAt: '2026-01-15',
    icon: 'cloud-upload',
  },
  {
    id: 'family_sharing',
    title: 'Family Sharing',
    description: 'Connected family members can listen to your stories and leave comments.',
    consentedAt: '2026-01-15',
    icon: 'family-restroom',
  },
];

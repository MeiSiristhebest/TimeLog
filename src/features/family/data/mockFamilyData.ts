/**
 * Mock Data for Family Feature
 */

export const FAMILY_STRINGS = {
  familyMembers: {
    title: 'Family Members',
    headerTitle: 'Connected Family',
    subText: 'These family members can listen to your stories and leave comments.',
    emptyText: 'No family members connected yet.',
    removeAlert: {
      title: 'Remove Member?',
      message: '{name} will no longer be able to view your stories.',
      confirm: 'Remove',
      cancel: 'Cancel',
    },
    adminBadge: 'Admin',
    linkedSince: 'Linked since {date}',
    loadingText: 'Loading family members...',
  },
  invite: {
    title: 'Invite Family',
    header: 'Invite a family member',
    subText:
      'Enter their email to generate a shareable link. They will join your family account after accepting the invite.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'sibling@example.com',
    generateButton: {
      idle: 'Generate Invite',
      loading: 'Generating...',
    },
    inviteReady: {
      title: 'Invite Ready',
      alertTitle: 'Invite Ready!',
      alertMessage: 'Tap "Share link" to send it to your family member.',
      devNote:
        'Dev builds use the exp+timelog scheme. Open the link from another device or tap “Open link” to test.',
      shareButton: 'Share Link',
      openButton: 'Open Link',
      shareMessage:
        'Join my family on TimeLog!\n\nCopy this entire message and open the TimeLog app to accept: {link}',
    },
    errors: {
      createFailed: 'Unable to create invite right now.',
      openFailed: 'Unable to open the invite link.',
      alertTitle: 'Could Not Open',
    },
  },
  acceptInvite: {
    headerTitle: 'Join Family',
    title: 'Accept Invitation',
    subText:
      'Confirm to join this family account. You need to be signed in with the correct email before accepting.',
    tokenLabel: 'Invite Token',
    noToken: 'No token found in the link.',
    buttons: {
      accept: 'Accept Invite',
      joining: 'Joining…',
      home: 'Go to Home',
      continue: 'Continue',
    },
    success: {
      title: 'Welcome!',
      message: 'You have successfully joined the family account.',
    },
    errors: {
      acceptFailed: 'Unable to accept invite right now.',
    },
  },
  askQuestion: {
    title: 'Ask a Question',
    header: 'Choose from our suggestions or write your own question to inspire a new story.',
    suggestionsTitle: 'Suggestions',
    customInputLabel: 'Your Question',
    customInputPlaceholder: 'Type your question here...',
    submitButton: {
      idle: 'Send Question',
      sending: 'Sending...',
    },
    alerts: {
      missing: {
        title: 'Missing Question',
        message: 'Please enter a question to send.',
      },
      missingUser: {
        title: 'Error',
        message: 'Missing user information.',
      },
      success: {
        title: 'Sent!',
        message: 'Your question has been sent.',
        button: 'Done',
      },
      error: {
        title: 'Error',
        message: 'Failed to send question. Please try again.',
      },
    },
  },
} as const;

export type FamilyMemberMock = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: 'admin' | 'member';
  linkedAt: string;
};

// Mock data - replace with real data from API
export const MOCK_FAMILY_MEMBERS: FamilyMemberMock[] = [
  {
    id: '1',
    name: 'Alice Chen',
    email: 'alice@example.com',
    avatarUrl: null,
    role: 'admin',
    linkedAt: '2026-01-10',
  },
  {
    id: '2',
    name: 'Bob Chen',
    email: 'bob@example.com',
    avatarUrl: null,
    role: 'member',
    linkedAt: '2026-01-12',
  },
];

/**
 * Mock Data for Account Security Screen
 * Adhering to reactcomponents skill: "Data decoupling: Move all static text... into src/data/mockData.ts"
 * In a real app, this might map to translation keys or CMS content.
 */

export const ACCOUNT_SECURITY_STRINGS = {
  headerTitle: 'Account & Security',
  profileSection: {
    editProfile: 'Edit Profile',
    role: 'Role',
  },
  securitySection: {
    recoveryCode: 'Recovery Code',
    deviceCode: 'Device Code',
    deviceManagement: 'Device Management',
  },
  signOutSection: {
    label: 'Sign Out',
    confirmTitle: 'Sign Out?',
    confirmMessage: 'You will need to sign in again to continue.',
    confirmAction: 'Sign Out',
    cancelAction: 'Cancel',
    loading: 'Loading profile details...',
  },
} as const;

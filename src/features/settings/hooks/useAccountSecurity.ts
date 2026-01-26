import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useProfile } from '../hooks/useProfile';
import { signOut } from '@/features/auth/services/authService';
import { clearStoredRole } from '@/features/auth/services/roleStorage';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { ACCOUNT_SECURITY_STRINGS } from '../data/mockAccountData';

export function useAccountSecurity() {
  const router = useRouter();
  const { profile, isLoading, updateProfileData, uploadProfileAvatar } = useProfile();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const roleLabel = profile?.role === 'family' ? 'Family' : 'Storyteller';
  const profileLabel = isLoading ? 'Loading...' : profile?.displayName || 'Not set';

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      await clearStoredRole();
    } catch (error: unknown) {
      HeritageAlert.show({
        title: 'Sign Out Failed',
        message: error instanceof Error ? error.message : 'Unable to sign out right now.',
        variant: 'error',
      });
    } finally {
      setIsSigningOut(false);
    }
  }, []);

  const confirmSignOut = useCallback(() => {
    HeritageAlert.show({
      title: ACCOUNT_SECURITY_STRINGS.signOutSection.confirmTitle,
      message: ACCOUNT_SECURITY_STRINGS.signOutSection.confirmMessage,
      variant: 'warning',
      primaryAction: {
        label: ACCOUNT_SECURITY_STRINGS.signOutSection.confirmAction,
        destructive: true,
        onPress: () => {
          void handleSignOut();
        },
      },
      secondaryAction: { label: ACCOUNT_SECURITY_STRINGS.signOutSection.cancelAction },
    });
  }, [handleSignOut]);

  return {
    router,
    profile,
    isLoading,
    profileLabel,
    roleLabel,
    showEditProfile,
    setShowEditProfile,
    isSigningOut,
    confirmSignOut,
    updateProfileData,
    uploadProfileAvatar,
  };
}

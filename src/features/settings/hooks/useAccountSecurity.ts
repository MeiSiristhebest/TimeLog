import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useProfile } from '../hooks/useProfile';
import { signOut } from '@/features/auth/services/authService';
import { clearStoredRole } from '@/features/auth/services/roleStorage';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { ACCOUNT_SECURITY_STRINGS } from '../data/mockAccountData';
import { deleteAccountData } from '../services/accountDeletionService';
import { APP_ROUTES } from '@/features/app/navigation/routes';

export function useAccountSecurity() {
  const router = useRouter();
  const { profile, isLoading, updateProfileData, uploadProfileAvatar } = useProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  const handleDeleteAccount = useCallback(async () => {
    setIsDeletingAccount(true);
    try {
      const result = await deleteAccountData();
      const warningSummary =
        result.warnings.length > 0
          ? `\n\nWarnings: ${result.warnings.join(' | ')}`
          : '';

      HeritageAlert.show({
        title: ACCOUNT_SECURITY_STRINGS.deleteAccountSection.successTitle,
        message: `${ACCOUNT_SECURITY_STRINGS.deleteAccountSection.successMessage}${warningSummary}`,
        variant: result.warnings.length > 0 ? 'warning' : 'success',
      });
      router.replace(APP_ROUTES.WELCOME);
    } catch (error: unknown) {
      HeritageAlert.show({
        title: ACCOUNT_SECURITY_STRINGS.deleteAccountSection.failedTitle,
        message:
          error instanceof Error
            ? error.message
            : ACCOUNT_SECURITY_STRINGS.deleteAccountSection.failedMessage,
        variant: 'error',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }, [router]);

  const confirmDeleteAccount = useCallback(() => {
    HeritageAlert.show({
      title: ACCOUNT_SECURITY_STRINGS.deleteAccountSection.confirmTitle,
      message: ACCOUNT_SECURITY_STRINGS.deleteAccountSection.confirmMessage,
      variant: 'warning',
      primaryAction: {
        label: ACCOUNT_SECURITY_STRINGS.deleteAccountSection.confirmAction,
        destructive: true,
        onPress: () => {
          void handleDeleteAccount();
        },
      },
      secondaryAction: { label: ACCOUNT_SECURITY_STRINGS.deleteAccountSection.cancelAction },
    });
  }, [handleDeleteAccount]);

  return {
    router,
    profile,
    isLoading,
    profileLabel,
    roleLabel,
    isSigningOut,
    isDeletingAccount,
    confirmSignOut,
    confirmDeleteAccount,
    updateProfileData,
    uploadProfileAvatar,
  };
}

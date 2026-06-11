import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useProfile } from '../hooks/useProfile';
import { signOut } from '@/features/auth/services/authService';
import { clearStoredRole } from '@/features/auth/services/roleStorage';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { deleteAccountData } from '../services/accountDeletionService';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/i18n/useTranslation';
import {
  addRememberedAccount,
  saveSessionTokens,
  removeRememberedAccount,
} from '@/features/auth/services/rememberedAccountsService';
import * as Haptics from 'expo-haptics';

export function useAccountSecurity() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile, isLoading, updateProfileData, uploadProfileAvatar } = useProfile();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const roleLabel =
    profile?.role === 'family'
      ? t('Auth.role.listenerTitle')
      : t('Auth.role.storytellerTitle');
  const profileLabel = isLoading ? t('Settings.loading') : profile?.displayName || t('Auth.switchAccount.tempAccount');

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (userId) {
        removeRememberedAccount(userId);
      }
      await signOut();
      await clearStoredRole();
      router.replace(APP_ROUTES.WELCOME);
    } catch (error: unknown) {
      HeritageAlert.show({
        title: t('Settings.accountSecurity.signOutFailed', { defaultValue: 'Sign Out Failed' }),
        message:
          error instanceof Error
            ? error.message
            : t('Settings.accountSecurity.signOutFailedMsg', {
                defaultValue: 'Unable to sign out right now.',
              }),
        variant: 'error',
      });
    } finally {
      setIsSigningOut(false);
    }
  }, [router, t]);

  const confirmSignOut = useCallback(() => {
    const isAnonymous = profile?.isAnonymous;

    if (isAnonymous) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      HeritageAlert.show({
        title: t('Settings.accountSecurity.signOutWarningTitle'),
        message: t('Settings.accountSecurity.signOutWarningMsg'),
        variant: 'warning',
        primaryAction: {
          label: t('Settings.accountSecurity.signOutWarningUpgrade'),
          onPress: () => router.push(APP_ROUTES.UPGRADE_ACCOUNT),
        },
        secondaryAction: {
          label: t('Settings.accountSecurity.signOutWarningConfirm'),
          destructive: true,
          onPress: () => {
            void handleSignOut();
          },
        },
      });
    } else {
      HeritageAlert.show({
        title: t('Settings.items.logOut'),
        message: t('Settings.accountSecurity.signOutSection.confirmMessage', {
          defaultValue: 'Are you sure you want to log out?',
        }),
        variant: 'warning',
        primaryAction: {
          label: t('Settings.items.logOut'),
          destructive: true,
          onPress: () => {
            void handleSignOut();
          },
        },
        secondaryAction: {
          label: t('Settings.accountSecurity.signOutSection.cancelAction', {
            defaultValue: 'Cancel',
          }),
        },
      });
    }
  }, [profile, handleSignOut, router, t]);

  const confirmSwitchAccount = useCallback(() => {
    const isAnonymous = profile?.isAnonymous;

    const performSwitch = async () => {
      setIsSigningOut(true);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (session && profile) {
          const userId = session.user.id;
          // Save account in remembered list
          addRememberedAccount({
            userId,
            email: session.user.email || undefined,
            displayName: profile.displayName || undefined,
            role: profile.role || undefined,
            isAnonymous: session.user.is_anonymous || !session.user.email || false,
          });
          // Save session tokens securely
          await saveSessionTokens(userId, {
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          });
        }
        await signOut();
        await clearStoredRole();
        router.replace(APP_ROUTES.SWITCH_ACCOUNT);
      } catch (error) {
        HeritageAlert.show({
          title: t('Auth.deviceCode.error'),
          message: error instanceof Error ? error.message : t('Auth.switchAccount.failedSwitch', { defaultValue: 'Failed to switch account' }),
          variant: 'error',
        });
      } finally {
        setIsSigningOut(false);
      }
    };

    if (isAnonymous) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      HeritageAlert.show({
        title: t('Settings.accountSecurity.signOutWarningTitle'),
        message: t('Settings.accountSecurity.signOutWarningMsg'),
        variant: 'warning',
        primaryAction: {
          label: t('Settings.accountSecurity.signOutWarningUpgrade'),
          onPress: () => router.push(APP_ROUTES.UPGRADE_ACCOUNT),
        },
        secondaryAction: {
          label: t('Settings.accountSecurity.signOutWarningConfirm'),
          destructive: true,
          onPress: () => {
            void performSwitch();
          },
        },
      });
    } else {
      void performSwitch();
    }
  }, [profile, router, t]);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeletingAccount(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      const result = await deleteAccountData();
      const warningSummary =
        result.warnings.length > 0 ? `\n\nWarnings: ${result.warnings.join(' | ')}` : '';

      HeritageAlert.show({
        title: t('Settings.accountSecurity.deleteAccountSection.successTitle', {
          defaultValue: 'Account Deleted',
        }),
        message: `${t('Settings.accountSecurity.deleteAccountSection.successMessage', {
          defaultValue: 'Your account and all associated data have been permanently deleted.',
        })}${warningSummary}`,
        variant: result.warnings.length > 0 ? 'warning' : 'success',
      });
      router.replace(APP_ROUTES.WELCOME);
    } catch (error: unknown) {
      HeritageAlert.show({
        title: t('Settings.accountSecurity.deleteAccountSection.failedTitle', {
          defaultValue: 'Deletion Failed',
        }),
        message:
          error instanceof Error
            ? error.message
            : t('Settings.accountSecurity.deleteAccountSection.failedMessage', {
                defaultValue: 'Unable to delete your account at this time.',
              }),
        variant: 'error',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }, [router, t]);

  const confirmDeleteAccount = useCallback(() => {
    HeritageAlert.show({
      title: t('Settings.accountSecurity.deleteAccountSection.confirmTitle', {
        defaultValue: 'Delete Account?',
      }),
      message: t('Settings.accountSecurity.deleteAccountSection.confirmMessage', {
        defaultValue:
          'This action cannot be undone. All your recordings, transcripts, and profile data will be permanently deleted.',
      }),
      variant: 'warning',
      primaryAction: {
        label: t('Settings.accountSecurity.deleteAccountSection.confirmAction', {
          defaultValue: 'Delete',
        }),
        destructive: true,
        onPress: () => {
          void handleDeleteAccount();
        },
      },
      secondaryAction: {
        label: t('Settings.accountSecurity.deleteAccountSection.cancelAction', {
          defaultValue: 'Cancel',
        }),
      },
    });
  }, [handleDeleteAccount, t]);

  return {
    router,
    profile,
    isLoading,
    profileLabel,
    roleLabel,
    isSigningOut,
    isDeletingAccount,
    confirmSignOut,
    confirmSwitchAccount,
    confirmDeleteAccount,
    updateProfileData,
    uploadProfileAvatar,
  };
}

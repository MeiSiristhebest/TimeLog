import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { Ionicons } from '@/components/ui/Icon';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useHeritageTheme, PALETTE } from '@/theme/heritage';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuthStore } from '../store/authStore';
import { supabase } from '@/lib/supabase';
import {
  getRememberedAccounts,
  removeRememberedAccount,
  getSessionTokens,
  type RememberedAccount,
} from '../services/rememberedAccountsService';
import { signInAnonymously } from '../services/anonymousAuthService';
import { clearStoredDeviceCode } from '../services/deviceCodeStorage';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { syncStoriesDown, backfillLegacyMetadata } from '@/features/story-gallery/services/storySyncDownService';
import { devLog } from '@/lib/devLogger';
import { setStoredRole } from '../services/roleStorage';
import * as Haptics from 'expo-haptics';

export default function SwitchAccountScreen(): JSX.Element {
  const { t } = useTranslation();
  const theme = useHeritageTheme();
  const router = useRouter();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  const [accounts, setAccounts] = useState<RememberedAccount[]>([]);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAccounts(getRememberedAccounts());
  }, []);

  const handleSwitchAccount = async (account: RememberedAccount) => {
    if (switchingId || loading) return;
    setSwitchingId(account.userId);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 1. Try to restore session via cached tokens
      const tokens = await getSessionTokens(account.userId);
      if (tokens) {
        devLog.info('[SwitchAccountScreen] Restoring session tokens for:', account.userId);
        const { data, error } = await supabase.auth.setSession({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
        });

        if (!error && data.session) {
          // Success! Update auth store and role
          setAuthenticated(account.userId);
          await setStoredRole(account.role || 'storyteller');
          clearStoredDeviceCode(); // Clear cached device code of previous account
          devLog.info('[SwitchAccountScreen] Session restored successfully');

          // Trigger background sync-down to restore stories
          void syncStoriesDown(account.userId);
          // Backfill legacy recordings that are missing remote file_path/transcription
          void backfillLegacyMetadata(account.userId).then(() => {
            import('@/lib/sync-engine/store').then(({ useSyncStore }) => {
              useSyncStore.getState().processQueue().catch(() => {});
            });
          });

          router.replace(APP_ROUTES.TABS);
          return;
        }
        devLog.warn('[SwitchAccountScreen] Failed to set session with tokens:', error?.message);
      }

      // 2. If token restore fails or doesn't exist
      if (account.isAnonymous) {
        // Temporary accounts cannot login with password, must use recovery code
        HeritageAlert.show({
          title: t('Auth.loginRecovery.title'),
          message: t('Auth.loginRecovery.warning'),
          variant: 'warning',
          primaryAction: {
            label: t('Auth.loginRecovery.buttonLabel'),
            onPress: () => {
              router.push(APP_ROUTES.LOGIN_RECOVERY || (APP_ROUTES.WELCOME as any));
            },
          },
          secondaryAction: { label: t('Auth.switchAccount.removeConfirmCancel') },
        });
      } else {
        // Permanent account, go to login with email prefilled
        const routeStr = `${APP_ROUTES.LOGIN}?email=${encodeURIComponent(account.email || '')}`;
        router.push(routeStr as any);
      }
    } catch (error) {
      devLog.error('[SwitchAccountScreen] Error switching account:', error);
      HeritageAlert.show({
        title: t('Auth.deviceCode.error'),
        message: error instanceof Error ? error.message : t('Auth.switchAccount.unknownError', { defaultValue: 'Unknown error during switch' }),
        variant: 'error',
      });
    } finally {
      setSwitchingId(null);
    }
  };

  const handleForgetAccount = (account: RememberedAccount) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    HeritageAlert.show({
      title: t('Auth.switchAccount.removeConfirmTitle'),
      message: t('Auth.switchAccount.removeConfirmMsg', {
        name: account.displayName || account.email || t('Auth.switchAccount.tempAccount'),
      }),
      variant: 'warning',
      primaryAction: {
        label: t('Auth.switchAccount.removeConfirmAction'),
        destructive: true,
        onPress: () => {
          removeRememberedAccount(account.userId);
          setAccounts(getRememberedAccounts());
        },
      },
      secondaryAction: { label: t('Auth.switchAccount.removeConfirmCancel') },
    });
  };

  const handleLoginAnother = () => {
    router.push(APP_ROUTES.LOGIN);
  };

  const handleCreateNewAnonymous = async () => {
    if (loading) return;
    setLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await signInAnonymously();
      setAuthenticated(result.userId);
      await setStoredRole('storyteller');
      clearStoredDeviceCode(); // Clear cached device code of previous account
      router.replace(APP_ROUTES.TABS);
    } catch (error) {
      devLog.error('[SwitchAccountScreen] Failed to create new anonymous storyteller:', error);
      HeritageAlert.show({
        title: t('Auth.deviceCode.error'),
        message: error instanceof Error ? error.message : t('Auth.switchAccount.failedInitSession', { defaultValue: 'Failed to initialize session.' }),
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceDim }]}>
      <HeritageHeader title={t('Auth.switchAccount.title')} showBack={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <AppText style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {t('Auth.switchAccount.subtitle')}
        </AppText>

        <View style={styles.listContainer}>
          <AppText style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            {t('Auth.switchAccount.rememberedTitle')}
          </AppText>

          {accounts.map((account) => {
            const isSwitching = switchingId === account.userId;
            const initials = (account.displayName || 'S')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase();

            return (
              <View
                key={account.userId}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: theme.colors.surfaceCard,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <Pressable
                  onPress={() => handleSwitchAccount(account)}
                  disabled={switchingId !== null || loading}
                  style={styles.cardPressable}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${account.displayName}`}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: `${theme.colors.primary}15` },
                    ]}>
                    <AppText style={[styles.avatarText, { color: theme.colors.primary }]}>
                      {initials}
                    </AppText>
                  </View>

                  <View style={styles.info}>
                    <AppText style={[styles.name, { color: theme.colors.onSurface }]}>
                      {account.displayName || t('Auth.switchAccount.tempAccount')}
                    </AppText>
                    <AppText style={[styles.email, { color: theme.colors.textMuted }]}>
                      {account.isAnonymous ? t('Auth.switchAccount.tempAccount') : account.email}
                    </AppText>
                    <View style={styles.badgeContainer}>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor:
                              account.role === 'family' || account.role === 'listener'
                                ? `${theme.colors.amberCustom}15`
                                : `${theme.colors.sageGreen}15`,
                          },
                        ]}>
                        <AppText
                          style={[
                            styles.badgeText,
                            {
                              color:
                                account.role === 'family' || account.role === 'listener'
                                  ? theme.colors.amberCustom
                                  : theme.colors.sageGreen,
                            },
                          ]}>
                          {account.role === 'family' || account.role === 'listener'
                            ? t('Auth.role.listenerTitle')
                            : t('Auth.role.storytellerTitle')}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  {isSwitching ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Pressable
                      onPress={() => handleForgetAccount(account)}
                      style={styles.deleteButton}
                      accessibilityRole="button"
                      accessibilityLabel="Forget account">
                      <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                    </Pressable>
                  )}
                </Pressable>
              </View>
            );
          })}

          {accounts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={`${theme.colors.onSurface}30`} />
              <AppText style={{ color: theme.colors.textMuted, marginTop: 12 }}>
                {t('Auth.deviceManagement.empty')}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
          <HeritageButton
            title={t('Auth.switchAccount.addAccount')}
            onPress={handleLoginAnother}
            variant="primary"
            fullWidth
            style={styles.actionButton}
          />

          <HeritageButton
            title={loading ? t('Auth.role.loading') : t('Auth.switchAccount.createNew')}
            onPress={handleCreateNewAnonymous}
            disabled={loading}
            variant="secondary"
            fullWidth
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 48,
    flexGrow: 1,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 32,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    gap: 16,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  accountCard: {
    borderRadius: 20,
    borderWidth: 2,
    overflow: 'hidden',
  },
  cardPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: PALETTE.overlayLight,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  actionsContainer: {
    gap: 16,
  },
  actionButton: {
    height: 60,
  },
});

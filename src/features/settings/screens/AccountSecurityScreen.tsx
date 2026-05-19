import { AppText } from '@/components/ui/AppText';
import { ScrollView, View } from 'react-native';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useHeritageTheme } from '@/theme/heritage';
import { useAccountSecurityLogic } from '../hooks/useSettingsLogic';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { APP_ROUTES } from '@/features/app/navigation/routes';
import { useTranslation } from '@/lib/i18n/useTranslation';

// STRICT STITCH PROTOCOL: Pure View Component
export function AccountSecurityScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { t } = useTranslation();

  // Logic Separation
  const {
    isLoading,
    profileLabel,
    roleLabel,
    isSigningOut,
    isDeletingAccount,
    confirmSignOut,
    confirmDeleteAccount,
    actions,
  } = useAccountSecurityLogic();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title={t('Settings.items.accountSecurity')} showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}>
        {/* Profile Group */}
        <SettingsSection title={t('Settings.accountSecurity.sections.profile.title')}>
          <SettingsRow
            label={t('Settings.accountSecurity.sections.profile.editProfile')}
            value={profileLabel}
            iconName="person-circle-outline"
            iconColor={colors.sageGreen}
            onPress={() => actions.navigateTo(APP_ROUTES.SETTINGS_EDIT_PROFILE)}
          />
          <SettingsRow
            label={t('Settings.accountSecurity.sections.profile.role')}
            value={roleLabel}
            iconName="id-card-outline"
            iconColor={colors.amberCustom}
            onPress={() => actions.navigateTo(APP_ROUTES.SETTINGS_ROLE)}
            isLast
          />
        </SettingsSection>

        {/* Security Group */}
        <SettingsSection title={t('Settings.accountSecurity.sections.security.title')}>
          <SettingsRow
            label={t('Settings.accountSecurity.sections.security.recoveryCode')}
            iconName="key-outline"
            iconColor={colors.blueAccent}
            onPress={() => actions.navigateTo(APP_ROUTES.SETTINGS_RECOVERY_CODE)}
          />
          <SettingsRow
            label={t('Settings.accountSecurity.sections.security.deviceCode')}
            iconName="qr-code-outline"
            iconColor={colors.textMuted}
            onPress={() => actions.navigateTo(APP_ROUTES.SETTINGS_DEVICE_CODE)}
            isLast
          />
        </SettingsSection>

        {/* Sign Out Group (Action) */}
        <View style={{ marginTop: 24, gap: 12, paddingHorizontal: 16 }}>
          <HeritageButton
            title={isSigningOut ? t('Settings.loading') : t('Settings.items.logOut')}
            onPress={confirmSignOut}
            variant="secondary"
            fullWidth
            disabled={isSigningOut}
          />
          <HeritageButton
            title={isDeletingAccount ? t('Settings.loading') : t('Settings.accountSecurity.deleteAccount')}
            onPress={confirmDeleteAccount}
            variant="ghost"
            fullWidth
            disabled={isDeletingAccount}
          />
        </View>

        {isLoading ? (
          <AppText variant="caption" style={{ color: colors.textMuted }}>
            {t('Settings.loading')}
          </AppText>
        ) : null}
      </ScrollView>
    </View>
  );
}

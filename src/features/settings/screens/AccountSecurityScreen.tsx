import { AppText } from '@/components/ui/AppText';
import { ScrollView, View, ActivityIndicator } from 'react-native';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useHeritageTheme } from '@/theme/heritage';
import { useAccountSecurityLogic } from '../hooks/useSettingsLogic';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';

// STRICT STITCH PROTOCOL: Pure View Component
export function AccountSecurityScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { isLoading, profileLabel, roleLabel, isSigningOut, confirmSignOut, actions } =
    useAccountSecurityLogic();

  const STRINGS = SETTINGS_STRINGS.accountSecurity;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title={STRINGS.title} showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}>
        {/* Profile Group */}
        <SettingsSection title="PROFILE">
          <SettingsRow
            label={STRINGS.sections.profile.editProfile}
            value={profileLabel}
            iconName="person-circle-outline"
            iconColor={colors.sageGreen}
            onPress={() => actions.navigateTo('/(tabs)/settings/edit-profile')}
          />
          <SettingsRow
            label={STRINGS.sections.profile.role}
            value={roleLabel}
            iconName="id-card-outline"
            iconColor={colors.amberCustom}
            onPress={() => actions.navigateTo('/(tabs)/settings/role')}
            isLast
          />
        </SettingsSection>

        {/* Security Group */}
        <SettingsSection title="SECURITY">
          <SettingsRow
            label={STRINGS.sections.security.recoveryCode}
            iconName="key-outline"
            iconColor={colors.blueAccent}
            onPress={() => actions.navigateTo('/recovery-code')}
          />
          <SettingsRow
            label={STRINGS.sections.security.deviceCode}
            iconName="qr-code-outline"
            iconColor={colors.textMuted}
            onPress={() => actions.navigateTo('/(tabs)/settings/device-code')}
          />
          <SettingsRow
            label={STRINGS.sections.security.deviceManagement}
            iconName="phone-portrait-outline"
            iconColor={colors.primary}
            onPress={() => actions.navigateTo('/device-management')}
            isLast
          />
        </SettingsSection>

        {/* Sign Out Group (Action) */}
        <View style={{ marginTop: 24 }}>
          <SettingsRow
            label={STRINGS.sections.signOut.label}
            destructive
            showChevron={false}
            align="center"
            onPress={confirmSignOut}
            isLast
            rightElement={
              isSigningOut ? <ActivityIndicator size="small" color={colors.textMuted} /> : null
            }
          />
        </View>

        {isLoading ? (
          <AppText variant="caption" style={{ color: colors.textMuted }}>
            {STRINGS.loading}
          </AppText>
        ) : null}
      </ScrollView>
    </View>
  );
}

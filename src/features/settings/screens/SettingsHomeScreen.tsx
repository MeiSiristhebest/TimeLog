import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsRow } from '../components/SettingsRow';
import { UserProfileHeader } from '../components/UserProfileHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { useSettingsHome } from '../hooks/useSettingsLogic';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';
import { SettingsSection } from '../components/SettingsSection';

const NO_OP = () => {};

export function SettingsHomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useHeritageTheme();

  // Use existing logic for profile data
  const { userRole, profile, isProfileLoading } = useSettingsHome();

  const handleProfilePress = () => {
    router.push('/(tabs)/settings/account-security');
  };

  const displayName = isProfileLoading ? 'Loading...' : profile?.displayName || 'Set up profile';
  const roleLabel = userRole === 'storyteller' ? 'Storyteller' : 'Family Member';
  const avatarUrl = profile?.avatarUrl || undefined;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      {/* Status Bar Scrim - Matches Header Background */}
      <View style={{ height: insets.top, backgroundColor: colors.surfaceCard }} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        bounces={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom: 100,
        }}>
        {/* User Header Group */}
        <View style={{ marginBottom: 8 }}>
          <UserProfileHeader
            displayName={displayName}
            userId={roleLabel}
            role={userRole}
            onPress={handleProfilePress}
            avatar={avatarUrl}
          />
        </View>

        {/* TimeLog Functional Group */}
        <SettingsSection>
          <Link href="/(tabs)/gallery" asChild>
            <SettingsRow
              label={SETTINGS_STRINGS.home.myStories}
              iconName="book-outline"
              iconColor={colors.iconBlue} // Blue
            />
          </Link>
          <Link href="/family-members" asChild>
            <SettingsRow
              label={SETTINGS_STRINGS.home.familyMembers}
              iconName="people-outline"
              iconColor={colors.iconOrange} // Orange
            />
          </Link>
          <SettingsRow
            label={SETTINGS_STRINGS.home.favorites}
            iconName="heart-outline"
            iconColor={colors.iconRed} // Red
            onPress={NO_OP} // Placeholder
            isLast
          />
        </SettingsSection>

        {/* Settings Section - Link to new Options Page */}
        <SettingsSection>
          <Link href="/(tabs)/settings/app-settings" asChild>
            <SettingsRow
              label="Settings"
              iconName="settings-outline"
              iconColor={colors.iconBlue} // Blue/Gray
              isLast
            />
          </Link>
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

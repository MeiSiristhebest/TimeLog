import React, { useMemo, useState } from 'react';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SettingsRow } from '../components/SettingsRow';
import { UserProfileHeader } from '../components/UserProfileHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { useSettingsHome } from '../hooks/useSettingsLogic';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';
import { SettingsSection } from '../components/SettingsSection';
import { Pressable, ScrollView, View } from 'react-native';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { AppText } from '@/components/ui/AppText';
import {
  isProfilePromptDismissed,
  setProfilePromptDismissed,
} from '../services/profileOnboardingService';
import { APP_ROUTES } from '@/features/app/navigation/routes';

const NO_OP = () => { };

export function SettingsHomeScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useHeritageTheme();

  // Use existing logic for profile data
  const { userRole, profile, isProfileLoading, sessionUserId } = useSettingsHome();
  const [promptDismissed, setPromptDismissed] = useState(isProfilePromptDismissed());

  const handleProfilePress = () => {
    router.push(APP_ROUTES.SETTINGS_EDIT_PROFILE);
  };

  const displayName =
    profile?.displayName?.trim() || (isProfileLoading ? 'Storyteller' : 'Set up profile');
  const avatarUrl = profile?.avatarUrl?.trim() || profile?.avatarUri?.trim() || undefined;

  const profileIncomplete = useMemo(
    () => !profile?.displayName || !profile?.birthDate || !profile?.language,
    [profile]
  );

  const shouldShowUpgradePrompt = profile?.isAnonymous === true && !promptDismissed;
  const shouldShowProfilePrompt =
    profile?.isAnonymous !== true && profileIncomplete && !promptDismissed;

  const handleDismissPrompt = () => {
    setProfilePromptDismissed(true);
    setPromptDismissed(true);
  };

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
            userId={sessionUserId || 'guest-user'}
            role={userRole === 'listener' ? 'family' : 'storyteller'}
            onPress={handleProfilePress}
            avatar={avatarUrl}
          />
        </View>

        {shouldShowUpgradePrompt ? (
          <View
            className="mx-4 mb-4 rounded-2xl border px-4 py-4"
            style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}>
            <AppText className="text-base font-semibold mb-1" style={{ color: colors.onSurface }}>
              Upgrade to a permanent account
            </AppText>
            <AppText className="text-sm mb-3" style={{ color: colors.textMuted }}>
              You can keep using TimeLog now, but upgrading protects your stories and unlocks family
              sharing.
            </AppText>
            <HeritageButton
              title="Upgrade Account"
              onPress={() => router.push(APP_ROUTES.UPGRADE_ACCOUNT)}
              variant="primary"
              fullWidth
            />
            <Pressable onPress={handleDismissPrompt} className="mt-3 items-center">
              <AppText className="text-sm" style={{ color: colors.textMuted }}>
                Skip for now
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {shouldShowProfilePrompt ? (
          <View
            className="mx-4 mb-4 rounded-2xl border px-4 py-4"
            style={{ backgroundColor: colors.surfaceCard, borderColor: colors.border }}>
            <AppText className="text-base font-semibold mb-1" style={{ color: colors.onSurface }}>
              Complete your profile
            </AppText>
            <AppText className="text-sm mb-3" style={{ color: colors.textMuted }}>
              Add your birthday, language, and preferred text size for a more comfortable
              experience.
            </AppText>
            <HeritageButton
              title="Set Up Now"
              onPress={handleProfilePress}
              variant="primary"
              fullWidth
            />
            <Pressable onPress={handleDismissPrompt} className="mt-3 items-center">
              <AppText className="text-sm" style={{ color: colors.textMuted }}>
                Skip for now
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {/* TimeLog Functional Group */}
        <SettingsSection>
          <Link href={APP_ROUTES.GALLERY} asChild>
            <SettingsRow
              label={SETTINGS_STRINGS.home.myStories}
              iconName="book-outline"
              iconColor={colors.iconBlue} // Blue
            />
          </Link>
          <Link href={APP_ROUTES.FAMILY_MEMBERS} asChild>
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
          <Link href={APP_ROUTES.SETTINGS_APP_SETTINGS} asChild>
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

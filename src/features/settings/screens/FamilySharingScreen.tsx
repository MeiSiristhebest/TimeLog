import React from 'react';
import { View, ScrollView } from 'react-native';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { useHeritageTheme } from '@/theme/heritage';
import { useFamilySharingLogic } from '../hooks/useSettingsLogic';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';

export function FamilySharingScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { actions } = useFamilySharingLogic();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title={SETTINGS_STRINGS.familySharing.title} showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}>
        {/* Connections Group */}
        <SettingsSection>
          <SettingsRow
            label={SETTINGS_STRINGS.familySharing.connections.familyMembers}
            iconName="people-outline"
            iconColor={colors.primary} // Heritage Terra
            onPress={actions.navigateToFamilyMembers}
          />
          <SettingsRow
            label={SETTINGS_STRINGS.familySharing.connections.inviteFamily}
            iconName="person-add-outline"
            iconColor={colors.amberCustom} // Heritage Amber
            onPress={actions.navigateToInvite}
          />
          <SettingsRow
            label={SETTINGS_STRINGS.familySharing.connections.acceptInvite}
            iconName="mail-open-outline"
            iconColor={colors.sageGreen} // Heritage Sage
            onPress={actions.navigateToAcceptInvite}
            isLast
          />
        </SettingsSection>

        {/* Stories Group */}
        <SettingsSection>
          <SettingsRow
            label={SETTINGS_STRINGS.familySharing.stories.askQuestion}
            iconName="chatbubbles-outline"
            iconColor={colors.blueAccent} // Heritage Blue
            onPress={actions.navigateToAskQuestion}
            isLast
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

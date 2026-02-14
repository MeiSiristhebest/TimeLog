import { ScrollView, View } from 'react-native';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useAboutHelpLogic } from '../hooks/useSettingsLogic';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';

export function AboutHelpScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { actions } = useAboutHelpLogic();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title={SETTINGS_STRINGS.aboutHelp.title} showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48, gap: 8 }}>
        {/* Support Group */}
        <SettingsSection title={SETTINGS_STRINGS.aboutHelp.support.title}>
          <View style={{ backgroundColor: colors.surfaceCard }}>
            <SettingsRow
              label={SETTINGS_STRINGS.aboutHelp.support.helpCenter}
              iconName="school-outline"
              iconColor={colors.amberCustom}
              onPress={actions.navigateToHelp}
            />
            <SettingsRow
              label={SETTINGS_STRINGS.aboutHelp.support.contactSupport}
              iconName="mail-outline"
              iconColor={colors.sageGreen} // Heritage Sage
              onPress={actions.handleSupportEmail}
              isLast
            />
          </View>
        </SettingsSection>

      </ScrollView>
    </View>
  );
}

import { ScrollView, View } from 'react-native';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useAboutHelpLogic } from '../hooks/useSettingsLogic';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function AboutHelpScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { t } = useTranslation();

  // Logic Separation
  const { actions } = useAboutHelpLogic();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title={t('Settings.items.help')} showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48, gap: 8 }}>
        {/* Support Group */}
        <SettingsSection title={t('Settings.aboutHelp.support.title')}>
          <View style={{ backgroundColor: colors.surfaceCard }}>
            <SettingsRow
              label={t('Settings.aboutHelp.support.helpCenter')}
              iconName="school-outline"
              iconColor={colors.amberCustom}
              onPress={actions.navigateToHelp}
            />
            <SettingsRow
              label={t('Settings.aboutHelp.support.contactSupport')}
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

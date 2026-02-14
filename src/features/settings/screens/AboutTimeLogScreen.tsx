import Constants from 'expo-constants';
import { ScrollView, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useHeritageTheme } from '@/theme/heritage';

export function AboutTimeLogScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title="About TimeLog" showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48, gap: 8 }}>
        <SettingsSection title="APP">
          <View style={{ backgroundColor: colors.surfaceCard }}>
            <SettingsRow
              label="App Version"
              value={appVersion}
              iconName="information-circle-outline"
              iconColor={colors.textMuted}
              showChevron={false}
              isLast
            />
          </View>
        </SettingsSection>

        <View style={{ paddingHorizontal: 20 }}>
          <AppText style={{ color: colors.textMuted, fontSize: 14, lineHeight: 22 }}>
            TimeLog helps seniors capture life stories with simple voice-first recording and
            family sharing.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

export default AboutTimeLogScreen;


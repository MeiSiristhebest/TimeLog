import { ScrollView, Switch, View } from 'react-native';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useDataStorageLogic } from '../hooks/useSettingsLogic';
import { SETTINGS_STRINGS } from '../data/mockSettingsData';

export function DataStorageScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useDataStorageLogic();
  const { cloudAIEnabled, isLoading, isSaving } = state;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title="Data & Storage" showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}>
        {/* Cloud Processing Group */}
        <SettingsSection
          title={SETTINGS_STRINGS.dataStorage.cloudProcessing.title}
          footer={SETTINGS_STRINGS.dataStorage.cloudProcessing.caption}>
          <SettingsRow
            label={SETTINGS_STRINGS.dataStorage.cloudProcessing.label}
            showChevron={false}
            iconName="cloud-upload-outline"
            iconColor={colors.blueAccent}
            isLast
            rightElement={
              <Switch
                value={cloudAIEnabled}
                onValueChange={(value) => {
                  void actions.handleCloudToggle(value);
                }}
                disabled={isLoading || isSaving}
                trackColor={{ false: '#767577', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </SettingsSection>

        {/* Storage Group */}
        <SettingsSection title={SETTINGS_STRINGS.dataStorage.storage.title}>
          <SettingsRow
            label={SETTINGS_STRINGS.dataStorage.storage.deletedItems}
            iconName="trash-outline"
            iconColor={colors.primary}
            onPress={actions.navigateToDeletedItems}
            isLast
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

import { ScrollView, Switch, View } from 'react-native';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useDataStorageLogic } from '../hooks/useSettingsLogic';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function DataStorageScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const { t } = useTranslation();

  // Logic Separation
  const { state, actions } = useDataStorageLogic();
  const { cloudAIEnabled, isLoading, isSaving } = state;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title={t('Settings.items.dataStorage')} showBack />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}>
        {/* Cloud Processing Group */}
        <SettingsSection
          title={t('Settings.dataStorage.cloudProcessing.title')}
          footer={t('Settings.dataStorage.cloudProcessing.caption')}>
          <SettingsRow
            label={t('Settings.dataStorage.cloudProcessing.label')}
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
        <SettingsSection title={t('Settings.dataStorage.storage.title')}>
          <SettingsRow
            label={t('Settings.dataStorage.storage.deletedItems')}
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

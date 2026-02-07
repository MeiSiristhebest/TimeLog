import { AppText } from '@/components/ui/AppText';
import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { DeletedItemsList } from '@/features/story-gallery/components/DeletedItemsList';
import { useStories } from '@/features/story-gallery/hooks/useStories';
import { restoreStory, permanentlyDeleteStory, offloadStory } from '@/features/story-gallery/services/storyService';
import { showSuccessToast } from '@/components/ui/feedback/toast';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { devLog } from '@/lib/devLogger';
import { PermanentDeleteModal } from '@/features/story-gallery/components/PermanentDeleteModal';

export default function DeletedItemsScreen(): JSX.Element {
  const { stories, isLoading } = useStories({ onlyDeleted: true });
  const { colors } = useHeritageTheme();

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleRestore = useCallback(async (id: string) => {
    try {
      await restoreStory(id);
      showSuccessToast('Story restored to gallery');
    } catch (error) {
      devLog.error('[DeletedItemsScreen] Failed to restore story:', error);
      HeritageAlert.show({
        title: 'Error',
        message: 'Failed to restore story. Please try again.',
        variant: 'error',
      });
    }
  }, []);

  const onTrashIconPress = useCallback((id: string) => {
    setSelectedId(id);
    setModalVisible(true);
  }, []);

  const handleDeleteEverywhere = useCallback(async () => {
    if (!selectedId) return;
    try {
      setModalVisible(false);
      await permanentlyDeleteStory(selectedId);
      showSuccessToast('Story permanently deleted');
      setSelectedId(null);
    } catch (error) {
      devLog.error('[DeletedItemsScreen] Failed to delete story:', error);
      HeritageAlert.show({
        title: 'Error',
        message: 'Failed to delete story.',
        variant: 'error',
      });
    }
  }, [selectedId]);

  const handleRemoveDownload = useCallback(async () => {
    if (!selectedId) return;
    try {
      setModalVisible(false);
      await offloadStory(selectedId);
      showSuccessToast('Download removed (Space saved)');
      setSelectedId(null);
    } catch (error) {
      devLog.error('[DeletedItemsScreen] Failed to offload story:', error);
      HeritageAlert.show({
        title: 'Error',
        message: 'Failed to offload story. It might strictly be unsynced.',
        variant: 'error',
      });
    }
  }, [selectedId]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title="Deleted Items" showBack />

      <View style={styles.container}>
        <View style={styles.notice}>
          <AppText style={[styles.noticeText, { color: colors.onSurface }]}>
            Stories are permanently deleted after 30 days.
          </AppText>
        </View>
        <DeletedItemsList
          items={stories}
          onRestore={handleRestore}
          onPermanentDelete={onTrashIconPress}
          isLoading={isLoading}
        />
      </View>

      <PermanentDeleteModal
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedId(null);
        }}
        onDeleteEverywhere={handleDeleteEverywhere}
        onRemoveDownload={handleRemoveDownload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notice: {
    padding: 16,
    paddingBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.6,
  },
});

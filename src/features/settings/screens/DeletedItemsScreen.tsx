import { AppText } from '@/components/ui/AppText';
import { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { DeletedItemsList } from '@/features/story-gallery/components/DeletedItemsList';
import { useStories } from '@/features/story-gallery/hooks/useStories';
import {
  restoreStory,
  permanentlyDeleteStory,
  offloadStory,
} from '@/features/story-gallery/services/storyService';
import { showSuccessToast } from '@/components/ui/feedback/toast';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { devLog } from '@/lib/devLogger';
import { PermanentDeleteModal } from '@/features/story-gallery/components/PermanentDeleteModal';
import { toStoryReadOnlyDeletedRoute } from '@/features/app/navigation/routes';

export default function DeletedItemsScreen(): JSX.Element {
  const router = useRouter();
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

  const handlePreview = useCallback(
    (id: string) => {
      router.push(toStoryReadOnlyDeletedRoute(id));
    },
    [router]
  );

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
      const success = await offloadStory(selectedId);
      if (success) {
        showSuccessToast('Download removed (Space saved)');
      } else {
        HeritageAlert.show({
          title: 'Not Synced',
          message: 'This story has not been fully synced to the cloud yet. We cannot remove the local copy until it is safely backed up.',
          variant: 'warning',
        });
      }
      setSelectedId(null);
    } catch (error) {
      devLog.error('[DeletedItemsScreen] Failed to offload story:', error);
      HeritageAlert.show({
        title: 'Error',
        message: 'Failed to offload story. Please try again.',
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
          onPreview={handlePreview}
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

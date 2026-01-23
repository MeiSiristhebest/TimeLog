import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Container } from '@/components/ui/Container';
import { DeletedItemsList } from '@/features/story-gallery/components/DeletedItemsList';
import { useStories } from '@/features/story-gallery/hooks/useStories';
import { restoreStory } from '@/features/story-gallery/services/storyService';
import { showSuccessToast } from '@/components/ui/feedback/toast';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';

export default function DeletedItemsScreen() {
  const router = useRouter();
  const { stories, isLoading } = useStories({ onlyDeleted: true });
  const { colors } = useHeritageTheme();

  const handleRestore = useCallback(async (id: string) => {
    try {
      await restoreStory(id);
      showSuccessToast('Story restored to gallery');
    } catch (error) {
      console.error('Failed to restore story:', error);
      HeritageAlert.show({
        title: 'Error',
        message: 'Failed to restore story. Please try again.',
        variant: 'error',
      });
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <HeritageHeader title="Deleted Items" showBack />

      <View style={styles.container}>
        <View
          style={[styles.notice, {
            backgroundColor: `${colors.primary}10`,
            borderColor: `${colors.primary}20`,
          }]}
        >
          <Text style={[styles.noticeText, { color: colors.onSurface }]}>
            Items are permanently deleted after 30 days.
          </Text>
        </View>
        <DeletedItemsList
          items={stories}
          onRestore={handleRestore}
          isLoading={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notice: {
    padding: 16,
    borderBottomWidth: 1,
  },
  noticeText: {
    fontSize: 15,
    textAlign: 'center',
  },
});


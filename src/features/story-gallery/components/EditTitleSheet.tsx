import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import React, { useState, useEffect } from 'react';
import {
  Platform,
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { updateStoryTitle } from '../services/storyService';
import { devLog } from '@/lib/devLogger';

interface EditTitleSheetProps {
  isVisible: boolean;
  onClose: () => void;
  storyId: string;
  initialTitle: string;
  onSuccess?: (newTitle: string) => void;
}

/**
 * EditTitleSheet: A modal/sheet for renaming stories.
 * Implements AC 1, 4, 5 of Story 3.5.
 * Uses KeyboardAvoidingView ensuring input remains visible.
 */
export function EditTitleSheet({
  isVisible,
  onClose,
  storyId,
  initialTitle,
  onSuccess,
}: EditTitleSheetProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when opening
  useEffect(() => {
    if (isVisible) {
      setTitle(initialTitle || '');
      setError(null);
      setIsSaving(false);
    }
  }, [isVisible, initialTitle]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Title cannot be empty');
      return;
    }

    if (trimmedTitle.length > 100) {
      setError('Title is too long (max 100 chars)');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Call service layer (Optimistic update handled internally + Sync queue)
      await updateStoryTitle(storyId, trimmedTitle);

      if (onSuccess) {
        onSuccess(trimmedTitle);
      }
      onClose();
    } catch (err) {
      devLog.error('Failed to save title:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const { colors } = useHeritageTheme();

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end">
        <TouchableOpacity
          className="absolute inset-0 bg-black/40"
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          className="rounded-t-3xl p-6 shadow-xl elevation-10"
          style={{
            backgroundColor: colors.surface,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            shadowColor: colors.primary, // Terracotta shadow
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
          }}>
          <View className="flex-row justify-between items-center mb-6">
            <AppText className="text-xl font-semibold" style={{ color: colors.onSurface, fontFamily: 'Fraunces_600SemiBold' }}>Edit Story Title</AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View className="gap-4">
            <TextInput
              className="border rounded-2xl p-[18px] text-lg"
              style={[
                {
                  borderColor: error ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.onSurface
                }
              ]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError(null);
              }}
              placeholder="Enter story title"
              placeholderTextColor={colors.textMuted}
              autoFocus={true}
              maxLength={100}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              accessibilityLabel="Story title input"
            />

            {error ? <AppText className="text-sm -mt-2" style={{ color: colors.error }}>{error}</AppText> : null}

            <View className="mb-2">
              <AppText className="text-sm italic" style={{ color: colors.textMuted }}>
                Tip: Gives your memory a meaningful name to help you remember it.
              </AppText>
            </View>

            <TouchableOpacity
              className="py-[18px] rounded-full items-center mt-2 shadow-sm elevation-4"
              style={[
                { backgroundColor: colors.primary },
                (!title.trim() || isSaving) && { opacity: 0.6, backgroundColor: colors.primaryMuted },
                {
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                }
              ]}
              onPress={handleSave}
              disabled={!title.trim() || isSaving}
              accessibilityLabel="Save title"
              accessibilityRole="button">
              {isSaving ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <AppText className="text-[17px] font-semibold" style={{ color: colors.onPrimary }}>Save Changes</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

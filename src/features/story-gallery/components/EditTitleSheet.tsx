import { AppText } from '@/components/ui/AppText';
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
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

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <AppText style={styles.title}>Edit Story Title</AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (error) setError(null);
              }}
              placeholder="Enter story title"
              autoFocus={true}
              maxLength={100}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              accessibilityLabel="Story title input"
            />

            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

            <View style={styles.excludeNote}>
              <AppText style={styles.hintText}>
                Tip: Gives your memory a meaningful name to help you remember it.
              </AppText>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, (!title.trim() || isSaving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!title.trim() || isSaving}
              accessibilityLabel="Save title"
              accessibilityRole="button">
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <AppText style={styles.saveButtonText}>Save Changes</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFCF7', // Surface Elevated
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#B85A3B', // Terracotta shadow
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B', // High contrast text
    fontFamily: 'Fraunces_600SemiBold',
  },
  content: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0', // Border color
    borderRadius: 16,
    padding: 18,
    fontSize: 18,
    color: '#1E293B',
    backgroundColor: '#F9F3E8', // Surface
  },
  inputError: {
    borderColor: '#B84A4A', // Heritage error
  },
  errorText: {
    color: '#B84A4A',
    fontSize: 14,
    marginTop: -8,
  },
  hintText: {
    color: '#475569', // Muted text
    fontSize: 14,
    fontStyle: 'italic',
  },
  excludeNote: {
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: '#B85A3B', // Heritage primary
    paddingVertical: 18,
    borderRadius: 999, // Pill shape
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#B85A3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#D4846A', // Primary soft
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF8E7', // On Primary
    fontSize: 17,
    fontWeight: '600',
  },
});

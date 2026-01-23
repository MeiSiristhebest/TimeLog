/**
 * CommentInput - Text input with send button for comments.
 *
 * Provides a multiline input field with character limit
 * and a send button. Handles keyboard interactions.
 *
 * Story 4.3: Realtime Comment System (AC: 1, 4)
 */

import { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeritageTheme } from '../../../theme/heritage';

type CommentInputProps = {
  /** Called when send button is pressed */
  onSend: (content: string) => void;
  /** Whether sending is in progress */
  isSending?: boolean;
  /** Whether the device is offline */
  isOffline?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum character length */
  maxLength?: number;
};

export const CommentInput = ({
  onSend,
  isSending = false,
  isOffline = false,
  placeholder = 'Share your thoughts...',
  maxLength = 1000,
}: CommentInputProps) => {
  const theme = useHeritageTheme();
  const [text, setText] = useState('');

  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending || isOffline) return;

    onSend(trimmedText);
    setText('');
    Keyboard.dismiss();
  }, [text, isSending, isOffline, onSend]);

  const canSend = text.trim().length > 0 && !isSending && !isOffline;
  const charCount = text.length;
  const isNearLimit = charCount > maxLength * 0.9;

  return (
    <View className="border-t" style={{ borderColor: theme.colors.border }}>
      {/* Offline warning */}
      {isOffline && (
        <View
          className="px-4 py-2 flex-row items-center"
          style={{ backgroundColor: `${theme.colors.error}20` }}
        >
          <Ionicons name="cloud-offline" size={16} color={theme.colors.error} />
          <Text className="ml-2 text-sm" style={{ color: theme.colors.error }}>
            Offline: Cannot send comments
          </Text>
        </View>
      )}

      {/* Input area */}
      <View className="flex-row items-end p-4">
        <View className="flex-1 mr-3">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={`${theme.colors.onSurface}66`}
            multiline
            maxLength={maxLength}
            editable={!isSending}
            className="rounded-xl px-4 py-3 text-base"
            style={{
              backgroundColor: theme.colors.surface,
              color: theme.colors.onSurface,
              maxHeight: 100,
              minHeight: 44,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
            accessibilityLabel="Comment input"
            accessibilityHint={`Max ${maxLength} characters`}
          />

          {/* Character count (shown when near limit) */}
          {isNearLimit && (
            <Text
              className="text-xs mt-1 text-right"
              style={{
                color: charCount >= maxLength ? theme.colors.error : `${theme.colors.onSurface}66`,
              }}
            >
              {charCount}/{maxLength}
            </Text>
          )}
        </View>

        {/* Send button - 48dp minimum touch target */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          className="items-center justify-center rounded-full"
          style={{
            width: 48,
            height: 48,
            backgroundColor: canSend ? theme.colors.primary : theme.colors.border,
          }}
          accessibilityRole="button"
          accessibilityLabel="Send comment"
          accessibilityState={{ disabled: !canSend }}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={canSend ? theme.colors.onPrimary : `${theme.colors.onSurface}66`}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

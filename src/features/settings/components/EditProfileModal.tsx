/**
 * Edit Profile Modal
 *
 * Allows users to edit their display name, role, and avatar.
 * Note: Avatar upload requires a development build (not Expo Go).
 */

import { AppText } from '@/components/ui/AppText';
import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  Modal,
  Platform,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useHeritageTheme } from '@/theme/heritage';
import type { UserProfile, ProfileUpdate } from '../services/profileService';
import { editProfileReducer, initialState } from '../reducers/editProfileReducer';
import { devLog } from '@/lib/devLogger';
import { Image } from 'expo-image';

// Lazy import for expo-image-picker to avoid crash in Expo Go
let ImagePicker: typeof import('expo-image-picker') | null = null;
let imagePickerPromise: Promise<typeof import('expo-image-picker') | null> | null = null;

function loadImagePicker(): Promise<typeof import('expo-image-picker') | null> {
  if (ImagePicker) {
    return Promise.resolve(ImagePicker);
  }

  if (imagePickerPromise) {
    return imagePickerPromise;
  }

  imagePickerPromise = import('expo-image-picker')
    .then((module) => {
      ImagePicker = module;
      return module;
    })
    .catch((error) => {
      devLog.warn('expo-image-picker not available (requires development build)', error);
      return null;
    });

  return imagePickerPromise;
}

type EditProfileModalProps = {
  visible: boolean;
  profile: UserProfile | null;
  onClose: () => void;
  onSave: (updates: ProfileUpdate) => Promise<void>;
  onUploadAvatar: (imageUri: string) => Promise<string | null>;
};

const ROLES: { value: 'storyteller' | 'family'; label: string }[] = [
  { value: 'storyteller', label: 'Storyteller' },
  { value: 'family', label: 'Family' },
];

export function EditProfileModal({
  visible,
  profile,
  onClose,
  onSave,
  onUploadAvatar,
}: EditProfileModalProps): JSX.Element {
  const theme = useHeritageTheme();
  const [state, dispatch] = useReducer(editProfileReducer, initialState);
  const [isImagePickerAvailable, setIsImagePickerAvailable] = useState(true);
  const { displayName, role, avatarUri, isSaving, isUploadingAvatar } = state;

  // Sync state when profile changes
  useEffect(() => {
    dispatch({ type: 'SYNC_PROFILE', payload: profile });
  }, [profile]);

  const handlePickImage = useCallback(async () => {
    const imagePicker = await loadImagePicker();
    if (!imagePicker) {
      HeritageAlert.show({
        title: 'Feature Not Available',
        message: 'Avatar upload requires a development build. This feature is not available in Expo Go.',
        variant: 'warning',
      });
      return;
    }

    try {
      const result = await imagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        dispatch({ type: 'START_UPLOAD' });
        try {
          const newUrl = await onUploadAvatar(result.assets[0].uri);
          if (newUrl) {
            dispatch({ type: 'UPLOAD_SUCCESS', payload: newUrl });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            dispatch({ type: 'UPLOAD_FAILURE', payload: 'Upload failed' });
          }
        } catch {
          dispatch({ type: 'UPLOAD_FAILURE', payload: 'Upload failed' });
          HeritageAlert.show({
            title: 'Upload Failed',
            message: 'Could not upload avatar. Please try again.',
            variant: 'error',
          });
        }
      }
    } catch {
      HeritageAlert.show({
        title: 'Error',
        message: 'Could not open image picker.',
        variant: 'error',
      });
    }
  }, [onUploadAvatar]);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      HeritageAlert.show({
        title: 'Name Required',
        message: 'Please enter a display name.',
        variant: 'warning',
      });
      return;
    }

    dispatch({ type: 'START_SAVE' });
    try {
      await onSave({
        displayName: displayName.trim(),
        role,
      });
      dispatch({ type: 'SAVE_SUCCESS' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch {
      dispatch({ type: 'SAVE_FAILURE', payload: 'Save failed' });
      HeritageAlert.show({
        title: 'Save Failed',
        message: 'Could not save profile. Please try again.',
        variant: 'error',
      });
    }
  }, [displayName, role, onSave, onClose]);

  useEffect(() => {
    let isActive = true;
    loadImagePicker().then((module) => {
      if (isActive) {
        setIsImagePickerAvailable(Boolean(module));
      }
    });
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        style={{ backgroundColor: theme.colors.surface }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-3 border-b border-black/5">
          <Pressable onPress={onClose} className="p-2">
            <Ionicons name="close" size={28} color={theme.colors.onSurface} />
          </Pressable>
          <AppText className="text-xl font-serif font-semibold">
            Edit Profile
          </AppText>
          <View className="w-11" />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 24, alignItems: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <Pressable onPress={handlePickImage} className="relative mb-2">
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 4,
                  borderColor: '#fff',
                }}
                contentFit="cover"
              />
            ) : (
              <View
                className="w-[120px] h-[120px] rounded-full items-center justify-center"
                style={{ backgroundColor: `${theme.colors.primary}20` }}>
                <Ionicons name="person" size={48} color={theme.colors.primary} />
              </View>
            )}
            {isUploadingAvatar ? (
              <View className="absolute inset-0 rounded-full items-center justify-center bg-black/50">
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <View className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center border-[3px] border-white" style={{ backgroundColor: theme.colors.primary }}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            )}
          </Pressable>
          <AppText className="text-sm mb-8" style={{ color: `${theme.colors.onSurface}80` }}>
            {isImagePickerAvailable
              ? 'Tap to change photo'
              : 'Avatar upload requires development build'}
          </AppText>

          {/* Display Name */}
          <View className="w-full mb-5">
            <AppText className="text-base font-semibold mb-2" style={{ color: theme.colors.onSurface }}>
              Display Name
            </AppText>
            <TextInput
              className="w-full h-14 rounded-xl border px-4 text-lg"
              style={{
                backgroundColor: `${theme.colors.primary}08`,
                borderColor: theme.colors.border,
                color: theme.colors.onSurface,
              }}
              value={displayName}
              onChangeText={(text) => dispatch({ type: 'SET_DISPLAY_NAME', payload: text })}
              placeholder="Enter your name"
              placeholderTextColor={`${theme.colors.onSurface}40`}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Role Selector */}
          <View className="w-full mb-5">
            <AppText className="text-base font-semibold mb-2" style={{ color: theme.colors.onSurface }}>Role</AppText>
            <View className="flex-row gap-3">
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => dispatch({ type: 'SET_ROLE', payload: r.value })}
                  className="flex-1 py-3.5 rounded-xl border-2 items-center"
                  style={{
                    backgroundColor:
                      role === r.value ? theme.colors.primary : `${theme.colors.primary}10`,
                    borderColor: theme.colors.primary,
                  }}>
                  <AppText
                    className="text-base font-semibold"
                    style={{ color: role === r.value ? '#fff' : theme.colors.primary }}>
                    {r.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Save Button */}
          <HeritageButton
            title={isSaving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            variant="primary"
            fullWidth
            disabled={isSaving}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

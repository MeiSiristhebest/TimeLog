/**
 * Edit Profile Modal
 *
 * Allows users to edit their display name, role, and avatar.
 * Note: Avatar upload requires a development build (not Expo Go).
 */

import { AppText } from '@/components/ui/AppText';
import { useCallback, useEffect, useReducer, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  Image,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useHeritageTheme } from '@/theme/heritage';
import type { UserProfile, ProfileUpdate } from '../services/profileService';
import { editProfileReducer, initialState } from '../reducers/editProfileReducer';
import { devLog } from '@/lib/devLogger';

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
      Alert.alert(
        'Feature Not Available',
        'Avatar upload requires a development build. This feature is not available in Expo Go.',
        [{ text: 'OK' }]
      );
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
      Alert.alert('Error', 'Could not open image picker.');
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
        style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={28} color={theme.colors.onSurface} />
          </Pressable>
          <AppText style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Edit Profile
          </AppText>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <Pressable onPress={handlePickImage} style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: `${theme.colors.primary}20` },
                ]}>
                <MaterialIcons name="person" size={48} color={theme.colors.primary} />
              </View>
            )}
            {isUploadingAvatar ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
                <MaterialIcons name="camera-alt" size={18} color="#fff" />
              </View>
            )}
          </Pressable>
          <AppText style={[styles.avatarHint, { color: `${theme.colors.onSurface}80` }]}>
            {isImagePickerAvailable
              ? 'Tap to change photo'
              : 'Avatar upload requires development build'}
          </AppText>

          {/* Display Name */}
          <View style={styles.fieldContainer}>
            <AppText style={[styles.label, { color: theme.colors.onSurface }]}>
              Display Name
            </AppText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: `${theme.colors.primary}08`,
                  borderColor: theme.colors.border,
                  color: theme.colors.onSurface,
                },
              ]}
              value={displayName}
              onChangeText={(text) => dispatch({ type: 'SET_DISPLAY_NAME', payload: text })}
              placeholder="Enter your name"
              placeholderTextColor={`${theme.colors.onSurface}40`}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Role Selector */}
          <View style={styles.fieldContainer}>
            <AppText style={[styles.label, { color: theme.colors.onSurface }]}>Role</AppText>
            <View style={styles.roleContainer}>
              {ROLES.map((r) => (
                <Pressable
                  key={r.value}
                  onPress={() => dispatch({ type: 'SET_ROLE', payload: r.value })}
                  style={[
                    styles.roleOption,
                    {
                      backgroundColor:
                        role === r.value ? theme.colors.primary : `${theme.colors.primary}10`,
                      borderColor: theme.colors.primary,
                    },
                  ]}>
                  <AppText
                    style={[
                      styles.roleText,
                      { color: role === r.value ? '#fff' : theme.colors.primary },
                    ]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Fraunces_600SemiBold',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 14,
    marginBottom: 32,
  },
  fieldContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

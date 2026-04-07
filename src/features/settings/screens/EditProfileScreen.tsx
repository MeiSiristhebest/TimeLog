import { AppText } from '@/components/ui/AppText';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme, FONT_SCALE_LABELS } from '@/theme/heritage';
import { useProfile } from '../hooks/useProfile';
import { useDisplaySettingsStore } from '../store/displaySettingsStore';
import { getLanguageLabel, getSystemLocale } from '../utils/languageOptions';
import { getLatestLocalProfile, updateLocalProfile } from '../services/localProfileService';
import { persistAvatarAssetUri } from '../services/avatarStorageService';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Image } from 'expo-image';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { devLog } from '@/lib/devLogger';
import { HeritageDatePicker } from '@/components/ui/HeritageDatePicker';
import { requestMediaLibraryWithRationale } from '@/utils/permissions';

let ImagePicker: typeof import('expo-image-picker') | null = null;
let imagePickerPromise: Promise<typeof import('expo-image-picker') | null> | null = null;

function loadImagePicker(): Promise<typeof import('expo-image-picker') | null> {
  if (ImagePicker) return Promise.resolve(ImagePicker);
  if (imagePickerPromise) return imagePickerPromise;

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

export function EditProfileScreen(): JSX.Element {
  const { colors, typography } = useHeritageTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ language?: string }>();
  const { profile, isLoading, updateProfileData, uploadProfileAvatar, refetch } = useProfile();
  const { fontScaleIndex, setFontScaleIndex } = useDisplaySettingsStore();
  const systemLocale = getSystemLocale();

  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [language, setLanguage] = useState(systemLocale);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hydratedProfileId, setHydratedProfileId] = useState<string | null>(null);

  const languageLabel = useMemo(
    () => getLanguageLabel(language, systemLocale),
    [language, systemLocale]
  );

  useEffect(() => {
    if (!profile) return;
    if (hydratedProfileId === profile.id) return;
    setDisplayName(profile.displayName ?? '');
    setBirthDate(profile.birthDate ? new Date(profile.birthDate) : null);
    setLanguage(profile.language ?? systemLocale);
    setAvatarUri(profile.avatarUri ?? profile.avatarUrl ?? null);
    setHydratedProfileId(profile.id);
  }, [profile, systemLocale, hydratedProfileId]);

  useEffect(() => {
    if (typeof params.language === 'string' && params.language.trim().length > 0) {
      setLanguage(params.language);
    }
  }, [params.language]);

  const handlePickImage = useCallback(async () => {
    try {
      const imagePicker = await loadImagePicker();
      if (!imagePicker) {
        HeritageAlert.show({
          title: 'Feature Not Available',
          message: 'Avatar upload requires a development build.',
          variant: 'warning',
        });
        return;
      }

      const granted = await requestMediaLibraryWithRationale(() =>
        imagePicker.requestMediaLibraryPermissionsAsync()
      );
      if (!granted) {
        HeritageAlert.show({
          title: 'Permission Required',
          message: 'Please allow photo library access to change your avatar.',
          variant: 'warning',
        });
        return;
      }

      const result = await imagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        const localAvatarUri = await persistAvatarAssetUri(uri);
        setAvatarUri(localAvatarUri);
        // Persist avatar selection locally immediately to avoid losing it if save flow is interrupted.
        void updateProfileData({ avatarUri: localAvatarUri }).catch((syncErr) => {
          devLog.warn('[EditProfileScreen] Immediate avatar local sync failed', syncErr);
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (pickErr) {
      devLog.error('[EditProfileScreen] Image pick failed', pickErr);
      HeritageAlert.show({
        title: 'Photo Upload Failed',
        message: 'Unable to open photo library. Please try again.',
        variant: 'error',
      });
    }
  }, [updateProfileData]);

  const handleSave = useCallback(async () => {
    if (!displayName.trim()) {
      HeritageAlert.show({
        title: 'Name Required',
        message: 'Please enter a display name.',
        variant: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      const selectedAvatar = avatarUri?.trim() || null;
      const previousAvatar = profile?.avatarUri ?? profile?.avatarUrl ?? null;

      // Save editable fields first to keep UX local-first and resilient.
      await updateProfileData({
        displayName: displayName.trim(),
        birthDate: birthDate ? birthDate.toISOString() : undefined,
        language,
        fontScaleIndex,
        avatarUri: selectedAvatar ?? undefined,
      });

      // Upload avatar in background if user selected a new local file.
      if (
        selectedAvatar &&
        selectedAvatar !== previousAvatar &&
        (selectedAvatar.startsWith('file://') || selectedAvatar.startsWith('content://'))
      ) {
        void uploadProfileAvatar(selectedAvatar)
          .then((uploadedAvatarUrl) => {
            if (uploadedAvatarUrl) {
              void updateProfileData({
                avatarUri: selectedAvatar,
                avatarUrl: uploadedAvatarUrl,
              });
            }
          })
          .catch((uploadErr) => {
            devLog.warn('[EditProfileScreen] Background avatar upload failed', uploadErr);
          });
      }

      // Keep save flow fast/local-first. Refresh profile in background.
      void refetch().catch((refreshErr) => {
        devLog.warn('[EditProfileScreen] Background profile refresh failed', refreshErr);
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      devLog.error('[EditProfileScreen] Save profile failed, trying local fallback', error);
      // Hard fallback: keep profile editable even when remote/auth state is unstable.
      const resolvedProfileId = profile?.id ?? (await getLatestLocalProfile())?.id ?? null;
      if (resolvedProfileId) {
        try {
          await updateLocalProfile(resolvedProfileId, {
            displayName: displayName.trim(),
            birthDate: birthDate ? birthDate.toISOString() : null,
            language,
            fontScaleIndex,
            avatarUri: avatarUri?.trim() || null,
          });
          void refetch().catch((refreshErr) => {
            devLog.warn('[EditProfileScreen] Background profile refresh failed', refreshErr);
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
          return;
        } catch (fallbackErr) {
          devLog.error('[EditProfileScreen] Local fallback save failed', fallbackErr);
        }
      }

      HeritageAlert.show({
        title: 'Save Failed',
        message: 'Could not save profile. Please try again.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }, [
    avatarUri,
    birthDate,
    displayName,
    fontScaleIndex,
    language,
    profile?.avatarUri,
    profile?.avatarUrl,
    profile?.id,
    refetch,
    router,
    updateProfileData,
    uploadProfileAvatar,
  ]);

  const handleLanguagePress = () => {
    router.push({
      pathname: '/(tabs)/settings/language',
      params: { current: language, from: 'edit-profile' },
    });
  };

  const handleFontSelect = (index: number) => {
    setFontScaleIndex(index);
  };

  const birthDateLabel = birthDate
    ? birthDate.toLocaleDateString()
    : 'Select your birthday';

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  return (
    <View style={styles.root}>
      <HeritageHeader title="Edit Profile" showBack />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          {/* Avatar Section */}
          <Pressable onPress={handlePickImage} style={styles.avatarSection}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View
                style={[styles.avatarPlaceholder, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="person" size={48} color={colors.primary} />
              </View>
            )}
            <AppText style={[styles.avatarHint, { color: colors.textMuted }]}>
              Tap to change photo
            </AppText>
          </Pressable>

          {/* Form Fields Section */}
          <View style={styles.formSection}>
            {/* Display Name */}
            <View style={styles.fieldContainer}>
              <AppText style={[styles.fieldLabel, { color: colors.onSurface }]}>
                Display Name
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: `${colors.primary}08`,
                    borderColor: colors.border,
                    color: colors.onSurface,
                  },
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={`${colors.onSurface}40`}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>

            {/* Birthday */}
            <View style={styles.fieldContainer}>
              <AppText style={[styles.fieldLabel, { color: colors.onSurface }]}>
                Birthday
              </AppText>
              <Pressable
                onPress={openDatePicker}
                style={[
                  styles.pressableInput,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.border }
                ]}>
                <AppText style={{ color: birthDate ? colors.onSurface : colors.textMuted }}>
                  {birthDateLabel}
                </AppText>
                <Ionicons name="calendar-outline" size={22} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Language */}
            <View style={styles.fieldContainer}>
              <AppText style={[styles.fieldLabel, { color: colors.onSurface }]}>
                Language
              </AppText>
              <Pressable
                onPress={handleLanguagePress}
                style={[
                  styles.pressableInput,
                  { backgroundColor: colors.surfaceCard, borderColor: colors.border }
                ]}>
                <AppText style={{ color: colors.onSurface }}>{languageLabel}</AppText>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Font Size */}
            <View style={styles.fontSizeSection}>
              <AppText style={[styles.fieldLabel, { color: colors.onSurface }]}>
                Font Size
              </AppText>
              <View style={styles.chipGroup}>
                {FONT_SCALE_LABELS.map((label, index) => (
                  <Pressable
                    key={label}
                    onPress={() => handleFontSelect(index)}
                    style={[
                      styles.chip,
                      {
                        borderColor: index === fontScaleIndex ? colors.primary : colors.border,
                        backgroundColor: index === fontScaleIndex ? `${colors.primary}15` : colors.surfaceCard,
                      },
                    ]}>
                    <AppText
                      style={{
                        color: index === fontScaleIndex ? colors.primary : colors.onSurface,
                        fontSize: Math.round(14 * (typography.body / 24)),
                        fontWeight: index === fontScaleIndex ? '700' : '400',
                      }}>
                      {label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <HeritageButton
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            variant="primary"
            fullWidth
            disabled={saving}
            style={styles.saveButton}
          />

          {isLoading ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <HeritageDatePicker
        visible={showDatePicker}
        value={birthDate}
        minimumDate={new Date(1920, 0, 1)}
        maximumDate={new Date()}
        title="Select Birthday"
        onCancel={() => setShowDatePicker(false)}
        onConfirm={(nextDate) => {
          setBirthDate(nextDate);
          setShowDatePicker(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF9F6', // Heritage surfaceDim fallback
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 80,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarImage: {
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
  avatarHint: {
    fontSize: 14,
    marginTop: 12,
  },
  formSection: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
  },
  pressableInput: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  fontSizeSection: {
    marginBottom: 24,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButton: {
    marginTop: 12,
  },
  loadingWrapper: {
    alignItems: 'center',
    marginTop: 16,
  },
});

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import { QRCodeModal } from '@/features/settings/components/QRCodeModal';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, TouchableOpacity, View } from 'react-native';
import { formatDisplayId } from '@/utils/formatters';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown, } from 'react-native-reanimated';

interface UserProfileHeaderProps {
  displayName: string;
  userId: string;
  role: 'storyteller' | 'family';
  avatar?: string;
  storyCount?: number;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function sanitizeAvatarUri(value?: string): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.toLowerCase();
  if (normalized === 'null' || normalized === 'undefined') {
    return null;
  }

  const isSupportedUri =
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/');

  return isSupportedUri ? trimmed : null;
}

export function UserProfileHeader({
  displayName,
  userId,
  role,
  avatar,
  storyCount = 0,
  onPress,
}: UserProfileHeaderProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const scale = useSharedValue(1);
  const [showQR, setShowQR] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const resolvedAvatar = useMemo(() => sanitizeAvatarUri(avatar), [avatar]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [resolvedAvatar]);

  const handlePressIn = () => {
    scale.value = withSpring(0.99, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handleQRPress = (e?: any) => {
    if (e) e.stopPropagation();
    Haptics.selectionAsync();
    setShowQR(true);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Mock ID for display if userId is an email
  const displayId = formatDisplayId(userId);

  return (
    <>
      <Animated.View entering={FadeInDown.duration(600).springify()}>
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            animatedStyle,
            { backgroundColor: colors.surfaceCard }, // White background
          ]}
          className="w-full mb-0.5">
          <View
            className="flex-row p-6 py-8 items-start gap-4"
            style={{
              flexDirection: 'row',
              paddingHorizontal: 24,
              paddingVertical: 32,
              alignItems: 'flex-start',
              gap: 16,
            }}>
            {/* Left: Avatar */}
            <View className="relative pt-1">
              {resolvedAvatar && !avatarLoadFailed ? (
                <Image
                  source={{ uri: resolvedAvatar }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    borderWidth: 0.5,
                    borderColor: 'rgba(0,0,0,0.1)',
                  }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <View
                  className="w-16 h-16 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: colors.surfaceDim }}>
                  <Icon name="person" size={40} color={colors.textMuted} />
                </View>
              )}
              {/* Online Status Dot */}
              <View
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                style={{
                  backgroundColor: colors.success,
                  borderColor: colors.surfaceCard,
                }}
              />
            </View>

            {/* Right: Info Columns */}
            <View className="flex-1 gap-1.5">
              {/* Row 1: Name + Chevron */}
              <View className="flex-row items-center justify-between">
                <AppText
                  className="flex-1 text-2xl font-serif font-semibold -tracking-[0.5px] mr-2"
                  style={{
                    flex: 1,
                    marginRight: 8,
                    fontSize: 34,
                    lineHeight: 40,
                    letterSpacing: -0.5,
                    fontFamily: 'Fraunces_600SemiBold',
                    color: colors.onSurface,
                  }}>
                  {displayName}
                </AppText>
                <View>
                  <Icon name="chevron-forward" size={18} color={colors.disabledText} />
                </View>
              </View>

              {/* Row 2: Heritage ID + QR Code */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleQRPress}
                className="flex-row items-center mb-2 self-start">
                <AppText
                  className="text-sm font-medium"
                  style={{
                    fontSize: 14,
                    lineHeight: 18,
                    fontWeight: '500',
                    color: colors.textMuted,
                  }}>
                  Heritage ID: {displayId}
                </AppText>
                <View className="ml-2 bg-black/5 p-1 rounded">
                  <Icon name="qr-code-outline" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>

              {/* Row 3: Buttons / Status */}
              <View className="flex-row items-center gap-2 flex-wrap">
                {/* Status Pill */}
                <View
                  className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border bg-transparent"
                  style={{ borderColor: colors.border }}>
                  <Icon name={role === 'storyteller' ? 'mic' : 'heart'} size={12} color={colors.primary} />
                  <AppText
                    className="text-xs font-medium"
                    style={{
                      fontSize: 12,
                      lineHeight: 16,
                      fontWeight: '500',
                      color: colors.textMuted,
                    }}>
                    {role === 'storyteller' ? 'Storyteller' : 'Family Member'}
                  </AppText>
                </View>

                {/* Story Count Pill */}
                {storyCount > 0 && (
                  <View
                    className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border bg-transparent"
                    style={{ borderColor: colors.border }}>
                    <Icon name="book" size={12} color={colors.textMuted} />
                    <AppText
                      className="text-xs font-medium"
                      style={{
                        fontSize: 12,
                        lineHeight: 16,
                        fontWeight: '500',
                        color: colors.textMuted,
                      }}>
                      {storyCount} Stories
                    </AppText>
                  </View>
                )}

              </View>
            </View>
          </View>
        </AnimatedPressable>
      </Animated.View>

      <QRCodeModal
        isVisible={showQR}
        onClose={() => setShowQR(false)}
        uid={userId}
        displayName={displayName}
        avatarUrl={avatar}
      />
    </>
  );
}

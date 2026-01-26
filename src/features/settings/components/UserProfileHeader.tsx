import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { formatDisplayId } from '@/utils/formatters';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';

interface UserProfileHeaderProps {
  displayName: string;
  userId: string;
  role: 'storyteller' | 'listener';
  avatar?: string;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function UserProfileHeader({
  displayName,
  userId,
  role,
  avatar,
  onPress,
}: UserProfileHeaderProps): JSX.Element {
  const { colors } = useHeritageTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.99, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Mock ID for display if userId is an email
  const displayId = formatDisplayId(userId);

  return (
    <AnimatedPressable
      entering={FadeInDown.duration(600).springify()}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        animatedStyle,
        { backgroundColor: colors.surfaceCard }, // White background
      ]}>
      <View style={styles.content}>
        {/* Left: Avatar */}
        <View style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceDim }]}>
              <Icon name="person" size={40} color={colors.textMuted} />
            </View>
          )}
        </View>

        {/* Right: Info Columns */}
        <View style={styles.infoColumn}>
          {/* Row 1: Name + QR Code */}
          <View style={styles.rowTop}>
            <AppText style={[styles.nameText, { color: colors.onSurface }]}>{displayName}</AppText>
            <View style={styles.qrContainer}>
              <Icon name="qr-code-outline" size={18} color={colors.textMuted} />
            </View>
            <View style={styles.chevronContainer}>
              <Icon name="chevron-forward" size={18} color={colors.disabledText} />
            </View>
          </View>

          {/* Row 2: WeChat ID */}
          <View style={styles.rowMiddle}>
            <AppText style={[styles.idText, { color: colors.textMuted }]}>
              WeChat ID: {displayId}
            </AppText>
          </View>

          {/* Row 3: Buttons */}
          <View style={styles.rowBottom}>
            {/* Status Button */}
            <Pressable
              style={({ pressed }) => [
                styles.statusButton,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.surfaceDim : 'transparent',
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.selectionAsync();
              }}>
              <Icon name="add" size={14} color={colors.textMuted} />
              <AppText style={[styles.statusText, { color: colors.textMuted }]}>Status</AppText>
            </Pressable>

            {/* More Button */}
            <Pressable
              style={({ pressed }) => [
                styles.moreButton,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.surfaceDim : 'transparent',
                },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                Haptics.selectionAsync();
              }}>
              <Icon name="ellipsis-horizontal" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 2, // Slight gap if needed, but usually handled by parent
  },
  content: {
    flexDirection: 'row',
    padding: 24,
    paddingVertical: 32, // Match prototype py-8
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarContainer: {
    paddingTop: 4, // Slight offset to match visual weight
  },
  avatar: {
    width: 64, // w-16
    height: 64, // h-16
    borderRadius: 8, // rounded-lg (approx 8px)
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.1)', // Keep semi-transparent black for avatar border or use theme if available
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoColumn: {
    flex: 1,
    gap: 6, // Vertical spacing between rows
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontSize: 24, // Slightly larger for Fraunces
    fontFamily: 'Fraunces_600SemiBold', // Heritage Tone
    // Color is handled by style prop injection using theme, avoiding hardcoded value here
    letterSpacing: -0.5,
    marginRight: 8,
    flex: 1,
  },
  qrContainer: {
    marginRight: 10,
  },
  chevronContainer: {
    // This aligns to right
  },
  rowMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  idText: {
    fontSize: 14,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
});

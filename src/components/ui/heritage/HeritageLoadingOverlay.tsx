import { AppText } from '@/components/ui/AppText';
import { View, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';

type HeritageLoadingOverlayProps = {
  /** Whether overlay is visible */
  visible: boolean;
  /** Loading message */
  message?: string;
  /** Show progress indicator */
  showProgress?: boolean;
  /** Progress value (0-1) */
  progress?: number;
};

export function HeritageLoadingOverlay({
  visible,
  message,
  showProgress = false,
  progress = 0,
}: HeritageLoadingOverlayProps) {
  const rotation = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const { colors } = useHeritageTheme();

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 200 });
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      backdropOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, backdropOpacity, rotation]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View
        className="absolute inset-0 flex-1 justify-center items-center"
        style={[{ backgroundColor: colors.backdrop }, backdropStyle]}
      >
        <View
          className={styles.container}
          style={{
            backgroundColor: colors.surface,
            shadowColor: '#000',
            shadowOpacity: 0.15
          }}
        >
          {/* Custom spinner */}
          <View className={styles.spinnerContainer}>
            <Animated.View style={spinnerStyle}>
              <Ionicons name="book" size={40} color={colors.primary} />
            </Animated.View>
            <ActivityIndicator size="large" color={colors.primary} className="absolute inset-0" />
          </View>

          {/* Message */}
          {message && <AppText className={styles.message} style={{ color: colors.onSurface }}>{message}</AppText>}

          {/* Progress */}
          {showProgress && (
            <View className={styles.progressContainer}>
              <View className={styles.progressTrack}>
                <View
                  className={styles.progressFill}
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: colors.primary
                  }}
                />
              </View>
              <AppText className={styles.progressText} style={{ color: colors.textMuted }}>{Math.round(progress * 100)}%</AppText>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = {
  container: 'rounded-2xl p-8 items-center min-w-[200px] shadow-lg elevation-12',
  spinnerContainer: 'relative w-16 h-16 items-center justify-center mb-4',
  message: 'text-base text-center mt-2',
  progressContainer: 'mt-4 w-full items-center',
  progressTrack: 'w-full h-1.5 bg-[#E8E0D5] rounded-full overflow-hidden',
  progressFill: 'h-full rounded-full',
  progressText: 'text-sm mt-2',
} as const;

export default HeritageLoadingOverlay;

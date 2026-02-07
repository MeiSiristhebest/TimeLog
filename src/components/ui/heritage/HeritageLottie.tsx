/**
 * HeritageLottie - Lottie animation wrapper.
 *
 * Features:
 * - Pre-configured animations
 * - Fallback to icon if animation file missing
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageLottie animation="success" size={120} />
 * <HeritageLottie source={require('./custom.json')} autoPlay loop={false} />
 */

import LottieView from 'lottie-react-native';
import { Ionicons } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import { useRef, useEffect } from 'react';
import { View } from 'react-native';

// Pre-built animation types
type AnimationType = 'loading' | 'success' | 'error' | 'empty' | 'recording' | 'syncing';

// Fallback icons for each animation type
const FALLBACK_ICONS: Record<AnimationType, keyof typeof Ionicons.glyphMap> = {
  loading: 'hourglass',
  success: 'checkmark-circle',
  error: 'alert-circle',
  empty: 'folder-open',
  recording: 'mic',
  syncing: 'cloud-upload',
};

type HeritageLottieProps = {
  /** Pre-built animation type */
  animation?: AnimationType;
  /** Custom Lottie source */
  source?: object;
  /** Size of the animation */
  size?: number;
  /** Auto play */
  autoPlay?: boolean;
  /** Loop animation */
  loop?: boolean;
  /** Speed multiplier */
  speed?: number;
  /** On animation finish callback */
  onAnimationFinish?: () => void;
};

export function HeritageLottie({
  animation,
  source,
  size = 120,
  autoPlay = true,
  loop = true,
  speed = 1,
  onAnimationFinish,
}: HeritageLottieProps) {
  const lottieRef = useRef<LottieView>(null);
  const { colors } = useHeritageTheme();

  useEffect(() => {
    if (autoPlay && lottieRef.current) {
      lottieRef.current.play();
    }
  }, [autoPlay]);

  // Get animation source
  const getSource = () => {
    if (source) return source;

    // Try to load pre-built animations
    // These will need to be added to assets/lottie/
    try {
      switch (animation) {
        case 'loading':
          return require('../../../../assets/lottie/loading.json');
        case 'success':
          return require('../../../../assets/lottie/success.json');
        case 'error':
          return require('../../../../assets/lottie/error.json');
        case 'empty':
          return require('../../../../assets/lottie/empty.json');
        case 'recording':
          return require('../../../../assets/lottie/recording.json');
        case 'syncing':
          return require('../../../../assets/lottie/syncing.json');
        default:
          return null;
      }
    } catch {
      // File doesn't exist, will use fallback
      return null;
    }
  };

  const animationSource = getSource();

  // Fallback to icon if no animation source
  if (!animationSource && animation) {
    return (
      <View
        className={styles.fallbackContainer}
        style={{ width: size, height: size, backgroundColor: colors.surfaceCream }} // Using surfaceCream as approximation of #F9F3E8
      >
        <Ionicons name={FALLBACK_ICONS[animation]} size={size * 0.5} color={colors.primary} />
      </View>
    );
  }

  if (!animationSource) {
    return null;
  }

  return (
    <LottieView
      ref={lottieRef}
      source={animationSource}
      style={{ width: size, height: size }}
      autoPlay={autoPlay}
      loop={loop}
      speed={speed}
      onAnimationFinish={onAnimationFinish}
    />
  );
}

const styles = {
  fallbackContainer: 'items-center justify-center rounded-full',
} as const;

export default HeritageLottie;

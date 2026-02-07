
import { AppText } from '@/components/ui/AppText';
import { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '@/theme/heritage';

const MINI_FAB_SIZE = 48;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FABAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

type HeritageFABProps = {
  /** Main FAB icon */
  icon: keyof typeof Ionicons.glyphMap;
  /** Icon when expanded (defaults to 'close') */
  iconExpanded?: keyof typeof Ionicons.glyphMap;
  /** Simple press handler (when no actions provided) */
  onPress?: () => void;
  /** Expandable action menu */
  actions?: FABAction[];
  /** Position from bottom */
  bottom?: number;
  /** Position from right */
  right?: number;
  /** Accessibility label */
  accessibilityLabel?: string;
};

type HeritageFABActionProps = {
  action: FABAction;
  index: number;
  expandProgress: SharedValue<number>;
  onPress: (action: FABAction) => void;
};

function HeritageFABAction({
  action,
  index,
  expandProgress,
  onPress,
}: HeritageFABActionProps): JSX.Element {
  const { colors } = useHeritageTheme();

  const actionStyle = useAnimatedStyle(() => {
    const translateY = interpolate(expandProgress.value, [0, 1], [0, -(index + 1) * 70]);
    const opacity = expandProgress.value;
    const actionScale = interpolate(expandProgress.value, [0, 1], [0.6, 1]);

    return {
      transform: [{ translateY }, { scale: actionScale }],
      opacity,
    };
  });

  return (
    <Animated.View className={styles.actionContainer} style={actionStyle}>
      <View
        className={styles.actionLabel}
        style={{
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOpacity: 0.15,
        }}>
        <AppText className={styles.actionLabelText} style={{ color: colors.onSurface }}>{action.label}</AppText>
      </View>
      <Pressable
        className={styles.actionButton}
        onPress={() => onPress(action)}
        style={{
          backgroundColor: colors.primary,
          shadowColor: colors.shadow,
          shadowOpacity: 0.25,
        }}>
        <Ionicons name={action.icon} size={24} color={colors.onPrimary} />
      </Pressable>
    </Animated.View>
  );
}

export function HeritageFAB({
  icon,
  iconExpanded = 'close',
  onPress,
  actions,
  bottom = 24,
  right = 24,
  accessibilityLabel = 'Action button',
}: HeritageFABProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const { colors } = useHeritageTheme();

  // Animation values
  const scale = useSharedValue(1);
  const shadowRadius = useSharedValue(12);
  const rotation = useSharedValue(0);
  const expandProgress = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 15 });
    shadowRadius.value = withTiming(6, { duration: 100 });
  }, [scale, shadowRadius]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
    shadowRadius.value = withTiming(12, { duration: 100 });
  }, [scale, shadowRadius]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (actions && actions.length > 0) {
      // Toggle expanded state
      const newExpanded = !isExpanded;
      setIsExpanded(newExpanded);
      expandProgress.value = withSpring(newExpanded ? 1 : 0, { damping: 18 });
      rotation.value = withSpring(newExpanded ? 45 : 0, { damping: 15 });
    } else if (onPress) {
      onPress();
    }
  }, [actions, isExpanded, expandProgress, rotation, onPress]);

  const handleActionPress = useCallback(
    (action: FABAction) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsExpanded(false);
      expandProgress.value = withTiming(0, { duration: 200 });
      rotation.value = withTiming(0, { duration: 200 });
      setTimeout(() => action.onPress(), 100);
    },
    [expandProgress, rotation]
  );

  // Animated styles
  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    shadowRadius: shadowRadius.value,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value * 0.3,
    pointerEvents: expandProgress.value > 0 ? 'auto' : 'none',
  }));

  return (
    <>
      {/* Backdrop when expanded */}
      {actions && (
        <AnimatedPressable
          className="absolute inset-0"
          style={[{ backgroundColor: '#000' }, backdropStyle]}
          onPress={() => {
            setIsExpanded(false);
            expandProgress.value = withTiming(0, { duration: 200 });
            rotation.value = withTiming(0, { duration: 200 });
          }}
        />
      )}

      <View className={styles.container} style={{ bottom, right }}>
        {/* Action buttons */}
        {actions &&
          actions.map((action, index) => (
            <HeritageFABAction
              key={`${action.label}-${index}`}
              action={action}
              index={index}
              expandProgress={expandProgress}
              onPress={handleActionPress}
            />
          ))}

        {/* Main FAB */}
        <AnimatedPressable
          className={styles.fab}
          style={[
            fabStyle,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.shadow,
              shadowOpacity: 0.35
            }
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button">
          <Ionicons name={isExpanded ? iconExpanded : icon} size={28} color={colors.onPrimary} />
        </AnimatedPressable>
      </View>
    </>
  );
}

const styles = {
  container: 'absolute items-center',
  fab: 'w-16 h-16 rounded-full items-center justify-center shadow-lg elevation-12',
  actionContainer: 'absolute bottom-0 flex-row items-center',
  actionLabel: 'px-3 py-2 rounded-lg mr-3 shadow-sm elevation-4',
  actionLabelText: 'text-sm font-semibold',
  actionButton: 'w-12 h-12 rounded-full items-center justify-center shadow-md elevation-8',
} as const;

export default HeritageFAB;

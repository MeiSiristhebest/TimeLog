import { useEffect } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AppText } from '@/components/ui/AppText';
import { useHeritageTheme } from '@/theme/heritage';
import { Icon } from '@/components/ui/Icon';

const CONTAINER_MIN_WIDTH = 180;
const CONTAINER_HEIGHT = 40;
const CONTAINER_INSET = 4;

export interface RecordingModeSwitcherProps {
  readonly mode: 'basic' | 'ai';
  readonly onSwitch: (mode: 'basic' | 'ai') => void;
  readonly disabled?: boolean;
}

export function RecordingModeSwitcher({
  mode,
  onSwitch,
  disabled = false,
}: Readonly<RecordingModeSwitcherProps>): JSX.Element {
  const { colors, isDark } = useHeritageTheme();
  const progress = useSharedValue(mode === 'basic' ? 0 : 1);
  const containerWidth = useSharedValue(CONTAINER_MIN_WIDTH);

  useEffect(() => {
    progress.value = withSpring(mode === 'basic' ? 0 : 1, {
      damping: 20,
      stiffness: 180,
    });
  }, [mode, progress]);

  const activePillStyle = useAnimatedStyle(() => {
    'worklet';
    const trackWidth = Math.max(0, containerWidth.value - CONTAINER_INSET * 2);
    const pillWidth = trackWidth / 2;
    return {
      width: pillWidth,
      height: '100%',
      borderRadius: 999,
      transform: [{ translateX: progress.value * pillWidth }],
    };
  });

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = Math.max(event.nativeEvent.layout.width, CONTAINER_MIN_WIDTH);
  };

  // Minimalist background: darker in light mode for contrast, lighter in dark mode
  const containerBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
  const activeBg = colors.surface;

  // Shadow only for the active pill to give it a "floating" feel, but subtle
  const activeShadowColor = isDark ? '#000' : '#888';

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        { backgroundColor: containerBg },
        disabled ? { opacity: 0.55 } : null,
      ]}
      accessibilityRole="radiogroup"
    >
      <View pointerEvents="none" style={styles.activeTrack}>
        <Animated.View
          style={[
            activePillStyle,
            {
              backgroundColor: activeBg,
              shadowColor: activeShadowColor,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.12,
              shadowRadius: 3,
              elevation: 1,
            },
          ]}
        />
      </View>

      <Pressable
        onPress={() => !disabled && onSwitch('basic')}
        style={styles.tabButton}
        accessibilityRole="radio"
        accessibilityState={{ checked: mode === 'basic' }}
        accessibilityLabel="Classic Recording Mode"
      >
        <Icon
          name={mode === 'basic' ? "mic" : "mic-outline"}
          size={14}
          color={mode === 'basic' ? colors.primary : colors.textMuted}
        />
        <AppText
          style={[
            styles.tabLabel,
            {
              fontFamily: 'System', // Use System font for UI controls (Clarify principle)
              fontWeight: mode === 'basic' ? '600' : '500',
            },
            { color: mode === 'basic' ? colors.primary : colors.textMuted },
          ]}
        >
          Classic
        </AppText>
      </Pressable>

      <Pressable
        onPress={() => !disabled && onSwitch('ai')}
        style={styles.tabButton}
        accessibilityRole="radio"
        accessibilityState={{ checked: mode === 'ai' }}
        accessibilityLabel="AI Assistant Mode"
      >
        <Icon
          name={mode === 'ai' ? "sparkles" : "sparkles-outline"}
          size={14}
          color={mode === 'ai' ? colors.tertiary : colors.textMuted}
        />
        <AppText
          style={[
            styles.tabLabel,
            {
              fontFamily: 'System',
              fontWeight: mode === 'ai' ? '600' : '500',
            },
            { color: mode === 'ai' ? colors.tertiary : colors.textMuted },
          ]}
        >
          AI Mode
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    padding: CONTAINER_INSET,
    height: CONTAINER_HEIGHT,
    minWidth: CONTAINER_MIN_WIDTH,
    // Removed border for "Deference" and "Less is More"
  },
  activeTrack: {
    position: 'absolute',
    inset: CONTAINER_INSET,
    flexDirection: 'row',
  },
  tabButton: {
    zIndex: 10,
    height: '100%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 13, // Slightly smaller for elegance
    letterSpacing: 0.3,
  },
});

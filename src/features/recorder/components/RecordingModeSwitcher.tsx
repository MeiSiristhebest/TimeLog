import { useEffect } from 'react';
import { type LayoutChangeEvent, Pressable, View } from 'react-native';
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
  const activeShadowColor = isDark ? '#000' : '#888';

  return (
    <View
      onLayout={handleLayout}
      className="flex-row items-center rounded-full"
      style={[
        { 
          backgroundColor: containerBg,
          padding: CONTAINER_INSET,
          height: CONTAINER_HEIGHT,
          minWidth: CONTAINER_MIN_WIDTH,
        },
        disabled ? { opacity: 0.55 } : null,
      ]}
      accessibilityRole="radiogroup"
    >
      <View pointerEvents="none" className="absolute flex-row" style={{ inset: CONTAINER_INSET }}>
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
        className="z-10 h-full flex-1 flex-row items-center justify-center gap-1.5"
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
          className="text-[13px] tracking-[0.3px]"
          style={[
            {
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
        className="z-10 h-full flex-1 flex-row items-center justify-center gap-1.5"
        accessibilityRole="radio"
        accessibilityState={{ checked: mode === 'ai' }}
        accessibilityLabel="AI Assistant Mode"
      >
        <Icon
          name={mode === 'ai' ? "sparkles" : "sparkles"}
          size={14}
          color={mode === 'ai' ? colors.tertiary : colors.textMuted}
        />
        <AppText
          className="text-[13px] tracking-[0.3px]"
          style={[
            {
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

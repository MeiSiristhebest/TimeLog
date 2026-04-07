import { memo } from 'react';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export interface HomeRecordButtonProps {
  readonly onPress: () => void;
  readonly color: string;
  readonly iconColor: string;
  readonly disabled?: boolean;
}

const buttonBaseStyle = {
  width: 100,
  height: 100,
  borderRadius: 999,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  overflow: 'hidden' as const,
  shadowColor: '#C26B4A',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.4,
  shadowRadius: 20,
  elevation: 10,
  zIndex: 1,
};

function HomeRecordButtonImpl({
  onPress,
  color,
  iconColor,
  disabled = false,
}: Readonly<HomeRecordButtonProps>): JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: color,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <Animated.Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Start recording your story"
      accessibilityHint="Tap to begin recording audio">
      <Animated.View style={[buttonBaseStyle, animatedStyle, { opacity: disabled ? 0.5 : 1 }]}>
        <Ionicons name="mic" size={52} color={iconColor} />
      </Animated.View>
    </Animated.Pressable>
  );
}

export const HomeRecordButton = memo(HomeRecordButtonImpl);

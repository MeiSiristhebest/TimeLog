import { memo } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface HomeRecordButtonProps {
  readonly onPress: () => void;
  readonly color: string;
  readonly iconColor: string;
  readonly disabled?: boolean;
}

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
    // Provide immediate "Heavy" impact for starting a significant action (Recording)
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
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
      <Animated.View 
        className="w-[100px] h-[100px] rounded-full items-center justify-center overflow-hidden elevation-10"
        style={[
          animatedStyle, 
          { 
            opacity: disabled ? 0.5 : 1,
            shadowColor: '#C26B4A',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
          }
        ]}>
        <Icon name="mic" size={52} color={iconColor} />
      </Animated.View>
    </Animated.Pressable>
  );
}

export const HomeRecordButton = memo(HomeRecordButtonImpl);

import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence,
    interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';

/**
 * Heritage Memoir colors
 */
const SOFT_CORAL = '#B85A3B'; // Deep Terracotta
const HEART_GRAY = '#94a3b8'; // slate-400

interface HeartIconProps {
    /** Whether the story is currently liked */
    isLiked: boolean;
    /** Callback when heart is tapped */
    onToggle: () => void;
    /** Disable interaction (e.g., during pending state) */
    disabled?: boolean;
    /** Size of the heart icon (default: 32) */
    size?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Heart Icon with animated fill transition and haptic feedback
 * 
 * Features:
 * - Scale "bounce" animation on tap
 * - Smooth fill color transition
 * - Haptic feedback on both like and unlike
 * - 48dp touch target (WCAG AAA compliant)
 * - Screen reader accessible
 */
export function HeartIcon({
    isLiked,
    onToggle,
    disabled = false,
    size = 32,
}: HeartIconProps) {
    const scale = useSharedValue(1);
    const fillProgress = useSharedValue(isLiked ? 1 : 0);

    // Sync fillProgress with isLiked prop changes
    useEffect(() => {
        fillProgress.value = withSpring(isLiked ? 1 : 0, {
            damping: 15,
            stiffness: 200,
        });
    }, [isLiked, fillProgress]);

    const handlePress = async () => {
        if (disabled) return;

        // Trigger haptic feedback (light impact)
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {
            // Haptics may not be available on all devices
        }

        // Bounce animation
        scale.value = withSequence(
            withSpring(1.2, { damping: 10, stiffness: 400 }),
            withSpring(1, { damping: 10, stiffness: 400 })
        );

        // Fill animation handled by effect watching isLiked

        // Trigger toggle callback
        onToggle();
    };

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // Animated fill color based on progress
    const fillColor = fillProgress.value > 0.5 ? SOFT_CORAL : 'transparent';
    const strokeColor = fillProgress.value > 0.5 ? SOFT_CORAL : HEART_GRAY;

    return (
        <AnimatedPressable
            onPress={handlePress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? 'Unlike story' : 'Like story'}
            accessibilityState={{ disabled }}
            accessibilityHint={isLiked ? 'Double-tap to remove your like' : 'Double-tap to like this story'}
            style={animatedContainerStyle}
            className="w-12 h-12 items-center justify-center"
        >
            <View style={{ opacity: disabled ? 0.5 : 1 }}>
                <Svg width={size} height={size} viewBox="0 0 24 24">
                    {/* Heart path - Material Design heart icon */}
                    <Path
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill={isLiked ? SOFT_CORAL : 'transparent'}
                        stroke={isLiked ? SOFT_CORAL : HEART_GRAY}
                        strokeWidth={2}
                    />
                </Svg>
            </View>
        </AnimatedPressable>
    );
}

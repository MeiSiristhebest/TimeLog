/**
 * HeritageHeader - Custom navigation header.
 *
 * Features:
 * - Large title support
 * - Blur background on scroll
 * - Custom back button
 * - Action buttons slot
 * - Heritage Memoir styling
 *
 * @example
 * <HeritageHeader
 *   title="My Stories"
 *   largeTitle
 *   rightActions={[
 *     { icon: 'add', onPress: handleAdd },
 *   ]}
 * />
 */

import { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '../../../theme/heritage';

// Heritage Memoir Design Tokens
const TOKENS = {
    primary: '#B85A3B',
    surface: '#F9F3E8',
    surfaceBlur: 'rgba(249, 243, 232, 0.92)',
    onSurface: '#1E293B',
    border: '#E2E8F0',
} as const;

type HeaderAction = {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    accessibilityLabel?: string;
};

type HeritageHeaderProps = {
    /** Header title */
    title: string;
    /** Show large title style */
    largeTitle?: boolean;
    /** Show back button */
    showBack?: boolean;
    /** Custom back button handler */
    onBack?: () => void;
    /** Right action buttons */
    rightActions?: HeaderAction[];
    /** Left action buttons (besides back) */
    leftActions?: HeaderAction[];
    /** Scroll offset for animations */
    scrollY?: SharedValue<number>;
    /** Background transparent */
    transparent?: boolean;
    /** Container style overrides */
    style?: any; // Using any to avoid complex StyleProp types import conflicts
};

export function HeritageHeader({
    title,
    largeTitle = false,
    showBack = false,
    onBack,
    rightActions = [],
    leftActions = [],
    scrollY,
    transparent = false,
    style,
}: HeritageHeaderProps) {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const theme = useHeritageTheme();
    const { colors } = theme;

    const handleBack = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onBack) {
            onBack();
        } else if (router.canGoBack()) {
            router.back();
        }
    }, [onBack, router]);

    const handleAction = useCallback((action: HeaderAction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action.onPress();
    }, []);

    // Animated styles based on scroll
    const headerBackgroundStyle = useAnimatedStyle(() => {
        if (!scrollY) return { opacity: transparent ? 0 : 1 };

        const opacity = interpolate(
            scrollY.value,
            [0, 50],
            [transparent ? 0 : 0.95, 1] // Slight transparency at start if not fully transparent
        );

        return { opacity, backgroundColor: colors.surface };
    });

    const largeTitleStyle = useAnimatedStyle(() => {
        if (!scrollY || !largeTitle) return {};

        const translateY = interpolate(
            scrollY.value,
            [0, 100],
            [0, -40]
        );
        const opacity = interpolate(
            scrollY.value,
            [0, 60],
            [1, 0]
        );

        return {
            transform: [{ translateY }],
            opacity,
        };
    });

    const smallTitleStyle = useAnimatedStyle(() => {
        if (!scrollY || !largeTitle) return { opacity: 1 };

        const opacity = interpolate(
            scrollY.value,
            [40, 80],
            [0, 1]
        );

        return { opacity };
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top }, style]}>
            {/* Background */}
            <Animated.View
                style={[
                    styles.background,
                    { paddingTop: insets.top },
                    headerBackgroundStyle,
                ]}
            />

            {/* Header bar */}
            <View style={styles.headerBar}>
                {/* Left side */}
                <View style={styles.leftContainer}>
                    {showBack && (
                        <Pressable
                            style={styles.backButton}
                            onPress={handleBack}
                            hitSlop={12}
                        >
                            <Ionicons name="chevron-back" size={28} color={colors.primary} />
                        </Pressable>
                    )}
                    {leftActions.map((action, index) => (
                        <Pressable
                            key={index}
                            style={styles.actionButton}
                            onPress={() => handleAction(action)}
                            hitSlop={8}
                            accessibilityLabel={action.accessibilityLabel}
                        >
                            <Ionicons name={action.icon} size={24} color={colors.primary} />
                        </Pressable>
                    ))}
                </View>

                {/* Title (small) */}
                <Animated.Text
                    style={[styles.title, { color: colors.onSurface }, largeTitle && smallTitleStyle]}
                    numberOfLines={1}
                >
                    {title}
                </Animated.Text>

                {/* Right side */}
                <View style={styles.rightContainer}>
                    {rightActions.map((action, index) => (
                        <Pressable
                            key={index}
                            style={styles.actionButton}
                            onPress={() => handleAction(action)}
                            hitSlop={8}
                            accessibilityLabel={action.accessibilityLabel}
                        >
                            <Ionicons name={action.icon} size={24} color={colors.primary} />
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Large title */}
            {largeTitle && (
                <Animated.View style={[styles.largeTitleContainer, largeTitleStyle]}>
                    <Text style={[styles.largeTitle, { color: colors.onSurface }]}>{title}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        zIndex: 100,
    },
    background: {
        ...StyleSheet.absoluteFillObject,
        // backgroundColor is set via animated style now
        borderBottomWidth: 0.5,
        borderBottomColor: '#E2E8F0', // Keep a fallback or use token effectively if possible via style injection used above
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        paddingHorizontal: 16,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 60,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        minWidth: 60,
        gap: 16,
    },
    backButton: {
        marginLeft: -8,
        padding: 4,
    },
    actionButton: {
        padding: 4,
    },
    title: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },
    largeTitleContainer: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    largeTitle: {
        fontSize: 34,
        fontWeight: '700',
        fontFamily: 'Fraunces_600SemiBold',
    },
});

export default HeritageHeader;

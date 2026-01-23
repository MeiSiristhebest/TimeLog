/**
 * ActivityCard - Card showing family activity on senior's home screen.
 * 
 * Displays recent interactions (comments, reactions) with Heritage Palette.
 * Story 5.1: Home Contextual Insights (AC: 1)
 */

import { View, Text, Pressable, AccessibilityInfo } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSequence,
    withSpring,
    useSharedValue,
} from 'react-native-reanimated';
import { Activity } from '../services/activityService';
import { useHeritageTheme } from '@/theme/heritage';

interface ActivityCardProps {
    activity: Activity;
    onPress: () => void;
    testID?: string;
}

/**
 * Format timestamp to absolute date (per UX anti-patterns: no relative time)
 */
function formatAbsoluteDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

/**
 * Get activity type icon
 */
function getActivityIcon(type: string): string {
    switch (type) {
        case 'comment':
            return '💬';
        case 'reaction':
            return '❤️';
        case 'story_share':
            return '🔗';
        default:
            return '📢';
    }
}

/**
 * Get activity message
 */
function getActivityMessage(activity: Activity): string {
    switch (activity.type) {
        case 'comment':
            return `${activity.actorName} commented on your story`;
        case 'reaction':
            return `${activity.actorName} liked your story`;
        case 'story_share':
            return `${activity.actorName} shared your story`;
        default:
            return 'New activity';
    }
}

export function ActivityCard({ activity, onPress, testID = 'activity-card' }: ActivityCardProps) {
    const scale = useSharedValue(1);
    const theme = useHeritageTheme();
    const { colors, animation } = theme;

    const handlePress = () => {
        // Press animation
        scale.value = withSpring(0.96, animation.press);
        onPress(); // Fire immediately for responsiveness, or delay if needed (usually immediate is better)
        // Reset scale is handled by withSpring returning to 1 via effect? 
        // No, unlike generic pressable, here we trigger it manually. 
        // Better to use useHeritagePress pattern or just separate pressIn/Out if possible.
        // But for now, simple spring sequence or revert:
        setTimeout(() => {
            scale.value = withSpring(1, animation.press);
        }, 100);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const message = getActivityMessage(activity);
    const icon = getActivityIcon(activity.type);

    return (
        <Pressable
            onPress={handlePress}
            testID={testID}
        // Ideally use onPressIn/Out for scale, but current implementation was simple click logic.
        // Keeping it simple but using theme animation.
        >
            <Animated.View
                style={[
                    {
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.primary,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 16,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 12,
                        elevation: 4,
                    },
                    animatedStyle,
                ]}
                accessibilityRole="button"
                accessibilityLabel={message}
                accessibilityHint="Double tap to view"
            >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    {/* Icon */}
                    <View
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: `${colors.primary}20`,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 24 }}>{icon}</Text>
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: colors.onSurface,
                                marginBottom: 4,
                            }}
                        >
                            {message}
                        </Text>
                        {activity.metadata?.commentText && (
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: colors.onSurface, // Need distinct color? onSurface is dark.
                                    opacity: 0.7,
                                    marginBottom: 8,
                                }}
                                numberOfLines={2}
                            >
                                "{activity.metadata.commentText}"
                            </Text>
                        )}
                        <Text
                            style={{
                                fontSize: 14,
                                color: colors.onSurface,
                                opacity: 0.5,
                            }}
                        >
                            {formatAbsoluteDate(activity.createdAt)}
                        </Text>
                    </View>

                    {/* Unread indicator */}
                    <View
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: colors.primary, // Use warning/reminder color
                        }}
                    />
                </View>
            </Animated.View>
        </Pressable>
    );
}

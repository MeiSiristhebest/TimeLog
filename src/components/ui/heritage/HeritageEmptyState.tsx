/**
 * HeritageEmptyState - Empty state component.
 *
 * Features:
 * - Icon or Lottie illustration
 * - Title and description
 * - Optional CTA button
 * - Consistent Heritage Memoir styling
 *
 * @example
 * <HeritageEmptyState
 *   icon="folder-open"
 *   title="No stories yet"
 *   description="Start recording your first story"
 *   actionTitle="Record Now"
 *   onAction={handleRecord}
 * />
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeritageButton } from './HeritageButton';

// Heritage Memoir Design Tokens
const TOKENS = {
    primary: '#B85A3B',
    surface: '#FFFCF7',
    onSurface: '#1E293B',
    textMuted: '#475569',
    iconBg: '#F9F3E8',
} as const;

type HeritageEmptyStateProps = {
    /** Icon name */
    icon: keyof typeof Ionicons.glyphMap;
    /** Main title */
    title: string;
    /** Description text */
    description?: string;
    /** CTA button title */
    actionTitle?: string;
    /** CTA button press handler */
    onAction?: () => void;
    /** Secondary action title */
    secondaryActionTitle?: string;
    /** Secondary action handler */
    onSecondaryAction?: () => void;
    /** Compact mode (less padding) */
    compact?: boolean;
};

export function HeritageEmptyState({
    icon,
    title,
    description,
    actionTitle,
    onAction,
    secondaryActionTitle,
    onSecondaryAction,
    compact = false,
}: HeritageEmptyStateProps) {
    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            {/* Icon */}
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={48} color={TOKENS.primary} />
            </View>

            {/* Text */}
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                {description && <Text style={styles.description}>{description}</Text>}
            </View>

            {/* Actions */}
            {(actionTitle || secondaryActionTitle) && (
                <View style={styles.actions}>
                    {actionTitle && onAction && (
                        <HeritageButton
                            title={actionTitle}
                            onPress={onAction}
                            variant="primary"
                            size="medium"
                        />
                    )}
                    {secondaryActionTitle && onSecondaryAction && (
                        <HeritageButton
                            title={secondaryActionTitle}
                            onPress={onSecondaryAction}
                            variant="ghost"
                            size="small"
                        />
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    containerCompact: {
        padding: 24,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: TOKENS.iconBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: TOKENS.onSurface,
        textAlign: 'center',
        marginBottom: 8,
        fontFamily: 'Fraunces_600SemiBold',
    },
    description: {
        fontSize: 16,
        color: TOKENS.textMuted,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
    },
    actions: {
        alignItems: 'center',
        gap: 12,
    },
});

export default HeritageEmptyState;

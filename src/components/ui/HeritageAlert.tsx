/**
 * HeritageAlert - Custom alert component replacing native Alert.alert().
 *
 * Features:
 * - Heritage Memoir design system
 * - Icon variants (success, warning, error, info)
 * - Primary/Secondary action buttons
 * - 56dp touch targets for elderly users
 * - Smooth animations
 *
 * @example
 * // Simple info alert
 * HeritageAlert.show({
 *   title: 'Success',
 *   message: 'Your story has been saved.',
 * });
 *
 * // Confirm alert with actions
 * HeritageAlert.show({
 *   title: 'Sign Out?',
 *   message: 'You will need to sign in again.',
 *   variant: 'warning',
 *   primaryAction: { label: 'Sign Out', onPress: handleSignOut },
 *   secondaryAction: { label: 'Cancel' },
 * });
 */

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { HeritageModal } from './HeritageModal';

// Heritage Memoir Design Tokens
const TOKENS = {
    primary: '#B85A3B',
    onPrimary: '#FFFFFF',
    surface: '#FFFCF7',
    onSurface: '#1E293B',
    textMuted: '#475569',
    error: '#B84A4A',
    warning: '#C49832',
    success: '#6B8E6B',
    info: '#5B8FB9',
    border: '#E2E8F0',
} as const;

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

type AlertAction = {
    label: string;
    onPress?: () => void;
    /** Whether this is a destructive action (shown in red) */
    destructive?: boolean;
};

type AlertConfig = {
    title: string;
    message?: string;
    variant?: AlertVariant;
    primaryAction?: AlertAction;
    secondaryAction?: AlertAction;
    /** Whether to show close button (default: true for info only) */
    showCloseButton?: boolean;
};

type AlertContextType = {
    show: (config: AlertConfig) => void;
    hide: () => void;
};

const AlertContext = createContext<AlertContextType | null>(null);

// Icon mapping for variants
const VARIANT_ICONS: Record<AlertVariant, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    info: { name: 'information-circle', color: TOKENS.info },
    success: { name: 'checkmark-circle', color: TOKENS.success },
    warning: { name: 'warning', color: TOKENS.warning },
    error: { name: 'alert-circle', color: TOKENS.error },
};

/**
 * Alert content component
 */
function AlertContent({
    config,
    onClose,
}: {
    config: AlertConfig;
    onClose: () => void;
}) {
    const { title, message, variant = 'info', primaryAction, secondaryAction } = config;
    const iconConfig = VARIANT_ICONS[variant];

    // Button press animation
    const primaryScale = useSharedValue(1);
    const secondaryScale = useSharedValue(1);

    const handlePrimaryPress = useCallback(() => {
        primaryScale.value = withSequence(
            withTiming(0.95, { duration: 50 }),
            withTiming(1, { duration: 100 })
        );
        primaryAction?.onPress?.();
        onClose();
    }, [primaryAction, onClose, primaryScale]);

    const handleSecondaryPress = useCallback(() => {
        secondaryScale.value = withSequence(
            withTiming(0.95, { duration: 50 }),
            withTiming(1, { duration: 100 })
        );
        secondaryAction?.onPress?.();
        onClose();
    }, [secondaryAction, onClose, secondaryScale]);

    const handleOkPress = useCallback(() => {
        onClose();
    }, [onClose]);

    const primaryButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: primaryScale.value }],
    }));

    const secondaryButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: secondaryScale.value }],
    }));

    const hasTwoButtons = primaryAction && secondaryAction;
    const hasOnlyPrimary = primaryAction && !secondaryAction;
    const showDefaultOk = !primaryAction && !secondaryAction;

    return (
        <View style={styles.alertContainer}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}15` }]}>
                <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            {message && <Text style={styles.message}>{message}</Text>}

            {/* Actions */}
            <View style={styles.actionsContainer}>
                {/* Two button layout */}
                {hasTwoButtons && (
                    <>
                        <Animated.View style={[styles.buttonWrapper, secondaryButtonStyle]}>
                            <Pressable
                                style={styles.secondaryButton}
                                onPress={handleSecondaryPress}
                                accessibilityRole="button"
                                accessibilityLabel={secondaryAction.label}
                            >
                                <Text style={styles.secondaryButtonText}>{secondaryAction.label}</Text>
                            </Pressable>
                        </Animated.View>

                        <Animated.View style={[styles.buttonWrapper, primaryButtonStyle]}>
                            <Pressable
                                style={[
                                    styles.primaryButton,
                                    primaryAction.destructive && styles.destructiveButton,
                                ]}
                                onPress={handlePrimaryPress}
                                accessibilityRole="button"
                                accessibilityLabel={primaryAction.label}
                            >
                                <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
                            </Pressable>
                        </Animated.View>
                    </>
                )}

                {/* Single primary button */}
                {hasOnlyPrimary && (
                    <Animated.View style={[styles.fullWidthButtonWrapper, primaryButtonStyle]}>
                        <Pressable
                            style={[
                                styles.primaryButton,
                                styles.fullWidthButton,
                                primaryAction.destructive && styles.destructiveButton,
                            ]}
                            onPress={handlePrimaryPress}
                            accessibilityRole="button"
                            accessibilityLabel={primaryAction.label}
                        >
                            <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
                        </Pressable>
                    </Animated.View>
                )}

                {/* Default OK button */}
                {showDefaultOk && (
                    <Pressable
                        style={[styles.primaryButton, styles.fullWidthButton]}
                        onPress={handleOkPress}
                        accessibilityRole="button"
                        accessibilityLabel="OK"
                    >
                        <Text style={styles.primaryButtonText}>OK</Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

/**
 * HeritageAlert Provider - Wrap your app with this
 */
export function HeritageAlertProvider({ children }: { children: ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<AlertConfig | null>(null);

    const show = useCallback((alertConfig: AlertConfig) => {
        setConfig(alertConfig);
        setVisible(true);
    }, []);

    const hide = useCallback(() => {
        setVisible(false);
        // Clear config after animation completes
        setTimeout(() => setConfig(null), 250);
    }, []);

    return (
        <AlertContext.Provider value={{ show, hide }}>
            {children}
            <HeritageModal
                visible={visible}
                onClose={hide}
                closeOnBackdrop={false}
                accessibilityLabel={config?.title ?? 'Alert'}
            >
                {config && <AlertContent config={config} onClose={hide} />}
            </HeritageModal>
        </AlertContext.Provider>
    );
}

/**
 * Hook to use HeritageAlert
 */
export function useHeritageAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useHeritageAlert must be used within HeritageAlertProvider');
    }
    return context;
}

/**
 * Static methods for imperative usage (requires Provider)
 */
let globalAlertRef: AlertContextType | null = null;

export function setGlobalAlertRef(ref: AlertContextType) {
    globalAlertRef = ref;
}

export const HeritageAlert = {
    show: (config: AlertConfig) => {
        if (!globalAlertRef) {
            console.warn('HeritageAlert: No provider found. Falling back to native Alert.');
            // Fallback to native Alert
            const { Alert } = require('react-native');
            Alert.alert(config.title, config.message);
            return;
        }
        globalAlertRef.show(config);
    },
    hide: () => {
        globalAlertRef?.hide();
    },
};

const styles = StyleSheet.create({
    alertContainer: {
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontFamily: 'Fraunces_600SemiBold',
        color: TOKENS.onSurface,
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 18,
        lineHeight: 26,
        color: TOKENS.textMuted,
        textAlign: 'center',
        marginBottom: 24,
    },
    actionsContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    buttonWrapper: {
        flex: 1,
    },
    fullWidthButtonWrapper: {
        width: '100%',
    },
    primaryButton: {
        backgroundColor: TOKENS.primary,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
        // Shadow
        shadowColor: TOKENS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    destructiveButton: {
        backgroundColor: TOKENS.error,
        shadowColor: TOKENS.error,
    },
    fullWidthButton: {
        width: '100%',
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: TOKENS.onPrimary,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: TOKENS.border,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    secondaryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: TOKENS.textMuted,
    },
});

export default HeritageAlert;

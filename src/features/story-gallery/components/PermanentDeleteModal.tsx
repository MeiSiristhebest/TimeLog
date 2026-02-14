import { AppText } from '@/components/ui/AppText';
import React, { useEffect } from 'react';
import { Modal, View } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming, } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '../../../theme/heritage';
import { HeritageButton } from '../../../components/ui/heritage/HeritageButton';

interface PermanentDeleteModalProps {
    visible: boolean;
    onCancel: () => void;
    onDeleteEverywhere: () => void;
    onRemoveDownload: () => void;
}

/**
 * Permanent Delete Modal - Tri-state choice.
 * 
 * Options:
 * 1. Delete Everywhere (Destructive)
 * 2. Remove Download (Space Saving)
 * 3. Cancel
 */
export function PermanentDeleteModal({
    visible,
    onCancel,
    onDeleteEverywhere,
    onRemoveDownload,
}: PermanentDeleteModalProps) {
    const theme = useHeritageTheme();

    // Animation Values
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            scale.value = withSpring(1, { damping: 15, stiffness: 150 });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else {
            opacity.value = withTiming(0, { duration: 150 });
            scale.value = withTiming(0.9, { duration: 150 });
        }
    }, [visible, opacity, scale]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onCancel}
            statusBarTranslucent>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                {/* Dimmed Backdrop */}
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                        },
                        animatedBackdropStyle,
                    ]}
                />

                {/* Modal Content */}
                <Animated.View
                    style={[
                        {
                            width: '100%',
                            maxWidth: 360,
                            backgroundColor: theme.colors.surface,
                            borderRadius: 32,
                            padding: 32,
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.25,
                            shadowRadius: 20,
                            elevation: 10,
                        },
                        animatedContainerStyle,
                    ]}>
                    {/* Icon */}
                    <View
                        style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: `${theme.colors.error}15`,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 24,
                        }}>
                        <Ionicons name="trash" size={36} color={theme.colors.error} />
                    </View>

                    {/* Text Content */}
                    <AppText
                        style={{
                            fontFamily: 'Fraunces_600SemiBold',
                            fontSize: 24,
                            color: theme.colors.onSurface,
                            textAlign: 'center',
                            marginBottom: 12,
                            lineHeight: 30,
                        }}>
                        Manage Deletion
                    </AppText>

                    <AppText
                        style={{
                            fontSize: 16,
                            color: theme.colors.textMuted,
                            textAlign: 'center',
                            marginBottom: 32,
                            lineHeight: 24,
                        }}>
                        You can remove this story permanently or just clear the download to save space.
                    </AppText>

                    {/* Action Buttons - Vertical Stack */}
                    <View style={{ width: '100%', gap: 12 }}>
                        <HeritageButton
                            title="Delete Everywhere"
                            onPress={onDeleteEverywhere}
                            variant="primary"
                            style={{
                                backgroundColor: theme.colors.error,
                                borderRadius: 99,
                                height: 56,
                            }}
                            textStyle={{ fontSize: 16, fontWeight: '700' }}
                            fullWidth
                        />

                        <HeritageButton
                            title="Remove Download Only"
                            onPress={onRemoveDownload}
                            variant="outline"
                            style={{
                                borderRadius: 99,
                                height: 56,
                                borderColor: theme.colors.primary,
                                borderWidth: 1.5,
                            }}
                            textStyle={{ fontSize: 16, color: theme.colors.primary, fontWeight: '600' }}
                            fullWidth
                        />

                        <HeritageButton
                            title="Cancel"
                            onPress={onCancel}
                            variant="ghost"
                            style={{
                                borderRadius: 99,
                                height: 56,
                                backgroundColor: theme.colors.surfaceDim,
                            }}
                            textStyle={{ fontSize: 16, color: theme.colors.textMuted, fontWeight: '600' }}
                            fullWidth
                        />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

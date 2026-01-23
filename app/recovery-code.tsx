/**
 * Recovery Code Screen
 * 
 * Allows family users to generate and manage recovery codes for seniors.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Share,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { showSuccessToast } from '@/components/ui/feedback/toast';
import { useHeritageTheme } from '@/theme/heritage';

export default function RecoveryCodeScreen() {
    const theme = useHeritageTheme();
    const scrollY = useSharedValue(0);
    const [recoveryCode, setRecoveryCode] = useState<string | null>('RCV-482-917');
    const [isGenerating, setIsGenerating] = useState(false);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const handleGenerateCode = async () => {
        HeritageAlert.show({
            title: 'Generate New Code?',
            message: 'This will invalidate the previous recovery code.',
            variant: 'warning',
            primaryAction: {
                label: 'Generate',
                onPress: async () => {
                    setIsGenerating(true);
                    // TODO: Call API to generate new recovery code
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    const newCode = `RCV-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
                    setRecoveryCode(newCode);
                    setIsGenerating(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
            },
            secondaryAction: { label: 'Cancel' },
        });
    };

    const handleCopyCode = async () => {
        if (recoveryCode) {
            await Clipboard.setStringAsync(recoveryCode);
            showSuccessToast('Code copied to clipboard');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleShareCode = async () => {
        if (recoveryCode) {
            try {
                await Share.share({
                    message: `TimeLog Recovery Code: ${recoveryCode}\n\nUse this code to restore access to the senior's device if it's lost or replaced.`,
                });
            } catch (error) {
                console.error('Share failed:', error);
            }
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <HeritageHeader
                title="Recovery Code"
                showBack
                scrollY={scrollY}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
            />

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.infoCard, { backgroundColor: `${theme.colors.primary}08` }]}>
                    <MaterialIcons name="vpn-key" size={32} color={theme.colors.primary} />
                    <Text style={[styles.infoTitle, { color: theme.colors.onSurface }]}>
                        Device Recovery
                    </Text>
                    <Text style={[styles.infoText, { color: `${theme.colors.onSurface}80` }]}>
                        This code can be used to restore access to the senior's TimeLog account if their device is lost, stolen, or replaced.
                    </Text>
                </View>

                {recoveryCode ? (
                    <View style={[styles.codeCard, { borderColor: theme.colors.primary }]}>
                        <Text style={[styles.codeLabel, { color: `${theme.colors.onSurface}60` }]}>
                            RECOVERY CODE
                        </Text>
                        <Text style={[styles.codeText, { color: theme.colors.primary }]}>
                            {recoveryCode}
                        </Text>
                        <View style={styles.codeActions}>
                            <HeritageButton
                                title="Copy"
                                icon="copy"
                                variant="secondary"
                                onPress={handleCopyCode}
                                style={{ flex: 1 }}
                            />
                            <HeritageButton
                                title="Share"
                                icon="share"
                                variant="secondary"
                                onPress={handleShareCode}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={[styles.noCodeCard, { borderColor: theme.colors.border }]}>
                        <MaterialIcons name="key-off" size={48} color={`${theme.colors.onSurface}30`} />
                        <Text style={[styles.noCodeText, { color: `${theme.colors.onSurface}60` }]}>
                            No recovery code generated yet.
                        </Text>
                    </View>
                )}

                <HeritageButton
                    title={isGenerating ? 'Generating...' : 'Generate New Code'}
                    icon="refresh"
                    variant="primary"
                    fullWidth
                    onPress={handleGenerateCode}
                    disabled={isGenerating}
                    style={{ marginTop: 24 }}
                />

                <View style={[styles.warningBox, { backgroundColor: '#FEF2F2' }]}>
                    <MaterialIcons name="warning" size={20} color="#EF4444" />
                    <Text style={styles.warningText}>
                        Keep this code secure. Anyone with this code can potentially access the senior's account.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingTop: 100,
    },
    infoCard: {
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    infoTitle: {
        fontSize: 22,
        fontFamily: 'Fraunces_600SemiBold',
        marginTop: 12,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    codeCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 2,
        padding: 24,
        alignItems: 'center',
    },
    codeLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    codeText: {
        fontSize: 36,
        fontWeight: '700',
        letterSpacing: 3,
        marginBottom: 20,
    },
    codeActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    noCodeCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        padding: 32,
        alignItems: 'center',
    },
    noCodeText: {
        fontSize: 16,
        marginTop: 16,
    },
    warningBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginTop: 24,
        alignItems: 'flex-start',
    },
    warningText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: '#991B1B',
    },
});

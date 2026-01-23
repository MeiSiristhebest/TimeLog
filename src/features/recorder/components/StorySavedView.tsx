/**
 * StorySavedView - Success screen after recording.
 * 
 * Implements the "Heritage Hybrid" success design:
 * - Success animation
 * - Polaroid-style card with slight rotation
 * - "Story Kept Safe" messaging
 * - Reuse of HeritageButton and Theme
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    withDelay,
    Easing,
    FadeInDown,
    ZoomIn,
    SlideInDown
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import { SafeAreaView } from 'react-native-safe-area-context';

// Assets
const PAPER_TEXTURE = require('../../../../assets/images/paper-texture.png');
const ILL_CHILDHOOD = require('../../../../assets/images/illustration_childhood.png');
const ILL_FAMILY = require('../../../../assets/images/illustration_family.png');
const ILL_CAREER = require('../../../../assets/images/illustration_career.png');
const ILL_WISDOM = require('../../../../assets/images/illustration_wisdom.png');
const ILL_MEMORIES = require('../../../../assets/images/illustration_memories.png');

interface StorySavedViewProps {
    onDismiss: () => void;
    storyTitle?: string;
    category?: string;
}

const { width } = Dimensions.get('window');

// Icon Helper
const getCategoryIllustration = (category?: string): any => {
    switch (category) {
        case 'childhood': return ILL_CHILDHOOD;
        case 'family': return ILL_FAMILY;
        case 'career': return ILL_CAREER;
        case 'memories': return ILL_MEMORIES;
        case 'wisdom': return ILL_WISDOM;
        default: return ILL_MEMORIES;
    }
};

export const StorySavedView = ({ onDismiss, storyTitle = "My Childhood Joy", category }: StorySavedViewProps) => {
    const { colors, radius, spacing } = useHeritageTheme();

    // Get dynamic illustration
    const illustrationSource = getCategoryIllustration(category);

    // Animations
    const rotate = useSharedValue(0);

    useEffect(() => {
        // 2026 UX: Celebration haptic sequence for "juiciness"
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Delayed second pulse for extra celebration
        const timer = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 300);

        // Random rotation between -3 and 3, avoiding 0.
        // Range: [-3, -1] U [1, 3] degrees
        const sign = Math.random() < 0.5 ? -1 : 1;
        const angle = (Math.random() * 2 + 1) * sign;

        // Tilt effect after slide in
        rotate.value = withDelay(600, withSpring(angle, { damping: 12 }));

        return () => clearTimeout(timer);
    }, []);

    const polaroidStyle = useAnimatedStyle(() => ({
        transform: [
            { rotate: `${rotate.value}deg` }
        ]
    }));

    return (
        <ImageBackground
            source={PAPER_TEXTURE}
            style={styles.container}
            resizeMode="repeat"
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>

                    {/* 1. Success Icon */}
                    <Animated.View
                        entering={ZoomIn.duration(600).springify()}
                        style={[styles.iconWrapper, { borderColor: `${colors.success}30`, backgroundColor: `${colors.success}10` }]}
                    >
                        <Ionicons name="checkmark-circle" size={80} color={colors.success} />
                    </Animated.View>

                    {/* 2. Text Content */}
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(600)}
                        style={styles.textContainer}
                    >
                        <Text style={[styles.title, { color: colors.onSurface }]}>Story Kept Safe.</Text>
                        <Text style={[styles.subtitle, { color: colors.textMuted }]}>Saving to your library...</Text>
                    </Animated.View>

                    {/* 3. Polaroid Card */}
                    <Animated.View
                        entering={SlideInDown.duration(800).springify().damping(12)}
                        style={[styles.polaroidContainer, polaroidStyle]}
                    >
                        <View style={[styles.polaroid, { backgroundColor: colors.surface }]}>
                            {/* Photo Area */}
                            <View style={styles.polaroidImage}>
                                <Image
                                    source={illustrationSource}
                                    style={{ width: '85%', height: '85%', opacity: 0.9 }}
                                    resizeMode="contain"
                                />
                                {/* Grain Overlay Simulation */}
                                <View style={[styles.overlay, { backgroundColor: `${colors.primary}05` }]} />
                            </View>

                            {/* Caption */}
                            <View style={styles.polaroidCaption}>
                                <Text
                                    style={[styles.handwritingText, { color: '#444' }]}
                                    numberOfLines={1}
                                >
                                    {storyTitle}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>

                </View>

                {/* 4. Footer Action */}
                <View style={styles.footer}>
                    <Animated.View entering={FadeInDown.delay(600).duration(500)} style={{ width: '100%' }}>
                        <HeritageButton
                            title="Done"
                            onPress={onDismiss}
                            variant="primary"
                            size="large"
                            fullWidth
                            icon="checkmark"
                        />
                    </Animated.View>
                </View>

            </SafeAreaView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 24,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingBottom: 60,
    },
    iconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 32,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 48,
        gap: 8,
    },
    title: {
        fontFamily: 'Fraunces_600SemiBold',
        fontSize: 32,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    polaroidContainer: {
        width: 280,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 10,
    },
    polaroid: {
        width: '100%',
        padding: 16,
        paddingBottom: 60,
        borderRadius: 4,
        alignItems: 'center',
    },
    polaroidImage: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F5F2EA',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    polaroidCaption: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    handwritingText: {
        fontFamily: 'Fraunces_600SemiBold', // Fallback to Fraunces italic if Handwriting not available
        fontStyle: 'italic',
        fontSize: 24,
    },
    footer: {
        width: '100%',
        maxWidth: 400,
    }
});

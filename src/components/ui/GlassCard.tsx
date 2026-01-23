import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * Apple-style Glassmorphism Card Component
 * 
 * Uses expo-blur to create a frosted glass effect similar to iOS.
 * Falls back to semi-transparent white on Android for performance.
 * 
 * @example
 * <GlassCard>
 *   <Text>Content here</Text>
 * </GlassCard>
 */
interface GlassCardProps {
    children: React.ReactNode;
    intensity?: number;
    style?: ViewStyle;
    className?: string;
}

export function GlassCard({
    children,
    intensity = 40,
    style,
}: GlassCardProps) {
    return (
        <View style={[styles.container, style]}>
            <BlurView intensity={intensity} tint="light" style={styles.blur}>
                <View style={styles.content}>{children}</View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderRadius: 24,
        // Heritage Memoir - Terracotta-tinted shadow
        shadowColor: '#B85A3B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8,
    },
    blur: {
        overflow: 'hidden',
    },
    content: {
        padding: 24,
        backgroundColor: 'rgba(255, 252, 247, 0.85)', // Surface Elevated with transparency
        borderWidth: 1,
        borderColor: 'rgba(184, 90, 59, 0.08)', // Subtle terracotta border
        borderRadius: 24,
    },
});

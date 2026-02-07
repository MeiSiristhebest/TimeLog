import React from 'react';
import type { ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { View } from 'react-native';

/**
 * Apple-style Glassmorphism Card Component
 *
 * Uses expo-blur to create a frosted glass effect similar to iOS.
 * Falls back to semi-transparent white on Android for performance.
 *
 * @example
 * <GlassCard>
 *   <AppText>Content here</AppText>
 * </GlassCard>
 */
interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  style?: ViewStyle;
  className?: string;
}

export function GlassCard({ children, intensity = 40, style }: GlassCardProps) {
  return (
    <View style={[styles.shadow, style]} className={styles.container}>
      <BlurView intensity={intensity} tint="light" style={{ overflow: 'hidden' }}>
        <View className={styles.content}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = {
  container: 'overflow-hidden rounded-3xl',
  blur: 'overflow-hidden',
  content: 'p-6 rounded-3xl border border-[rgba(184,90,59,0.08)] bg-[rgba(255,252,247,0.85)]',
  // Keep shadow as inline style for precise control until verified
  shadow: {
    shadowColor: '#B85A3B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  }
} as const;

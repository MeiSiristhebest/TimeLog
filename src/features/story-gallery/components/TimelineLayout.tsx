/**
 * TimelineLayout - Container with center-aligned timeline line
 * Matches HTML mockup: timeline-line at left: 50%, transform: translateX(-50%)
 */

import React from 'react';
import type { ReactNode } from 'react';
import { View } from '@/tw';
import { StyleSheet } from 'react-native';

interface TimelineLayoutProps {
  children: ReactNode;
}

export function TimelineLayout({ children }: TimelineLayoutProps): JSX.Element {
  return (
    <View className="relative flex-1 px-0 py-0">
      <View style={styles.timelineLine} />
      <View className="relative z-10 flex-1">{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  timelineLine: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -0.5 }], // -50% of 1px width
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E5E0DC',
    zIndex: 0,
  },
});

// Default export for React.lazy() compatibility
export default TimelineLayout;

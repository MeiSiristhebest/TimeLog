/**
 * TimelineLayout - Container with center-aligned timeline line
 * Matches HTML mockup: timeline-line at left: 50%, transform: translateX(-50%)
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface TimelineLayoutProps {
    children: React.ReactNode;
}

export const TimelineLayout = ({ children }: TimelineLayoutProps) => {
    return (
        <View className="flex-1 relative px-4 py-8">
            {/* Center Line - matching HTML: left: 50%, transform: translateX(-50%) */}
            <View style={styles.timelineLine} />

            {/* Content */}
            <View className="flex-1 relative z-10">
                {children}
            </View>
        </View>
    );
};

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

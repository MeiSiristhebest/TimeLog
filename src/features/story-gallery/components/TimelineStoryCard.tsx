/**
 * TimelineStoryCard - Story card for timeline view
 * EXACT match to HTML mockup including:
 * - "Alice is listening" indicator
 * - Story preview text
 * - Precise font sizes and spacing
 */

import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AudioRecording } from '@/types/entities';

// Cover images for featured stories
const COVER_IMAGES = [
    require('../../../../assets/images/illustration_childhood.png'),
    require('../../../../assets/images/illustration_family.png'),
    require('../../../../assets/images/illustration_career.png'),
];

// Accent bar colors
const ACCENT_COLORS: Record<string, string> = {
    featured: '#6B8C9E',
    default: '#EABFAA',
};

interface TimelineStoryCardProps {
    story: AudioRecording;
    onPlay: (id: string) => void;
    index: number;
    variant?: 'default' | 'featured';
}

export const TimelineStoryCard = ({ story, onPlay, index, variant = 'default' }: TimelineStoryCardProps) => {
    // Format date like HTML: "Jan 5, 2026 at 3:00 PM"
    const dateObj = new Date(story.startedAt);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const fullDateStr = `${dateStr} at ${timeStr}`;

    // Duration formatting
    const minutes = Math.floor(story.durationMs / 1000 / 60);
    const seconds = Math.floor((story.durationMs / 1000) % 60);
    const durationStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Status
    const isSynced = story.syncStatus === 'synced';
    const isSyncing = story.syncStatus === 'syncing' || story.syncStatus === 'queued';

    // Accent color
    const accentColor = variant === 'featured' ? ACCENT_COLORS.featured : ACCENT_COLORS.default;

    // Mock preview text - in real app, would come from transcription
    const previewText = "It was red, cherry red. My father brought it home...";

    // Mock listening indicator - would come from real-time listeners data
    const isBeingListened = index === 0; // First story being listened to
    const listenerName = "Alice";

    if (variant === 'featured') {
        // Featured Card - EXACT HTML match
        return (
            <View className="w-full flex items-center relative mb-10">
                {/* Center Timeline Dot - HTML: absolute left-1/2 -translate-x-1/2 -top-5 */}
                <View style={[styles.centerDot, { top: -20 }]} />

                <Pressable
                    onPress={() => onPlay(story.id)}
                    className="w-full bg-white rounded-2xl overflow-hidden"
                    style={styles.elevatedShadow}
                >
                    {/* Cover Image - HTML: h-40 */}
                    <View className="h-40 bg-stone-300 relative overflow-hidden">
                        <Image
                            source={COVER_IMAGES[index % COVER_IMAGES.length]}
                            className="w-full h-full opacity-90"
                            resizeMode="cover"
                        />
                        {/* Recorded Year Overlay - HTML: absolute bottom-3 left-4 */}
                        <View className="absolute bottom-3 left-4">
                            <Text className="text-white text-sm font-serif tracking-wide opacity-90">
                                Recorded {dateObj.getFullYear()}
                            </Text>
                        </View>
                    </View>

                    {/* Content with left accent bar - HTML: p-6 relative */}
                    <View className="p-6 relative">
                        {/* Left Accent Bar - HTML: absolute left-0 top-0 bottom-0 w-[4px] bg-[#6B8C9E] */}
                        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                        {/* Title Section - HTML: flex flex-col mb-4 */}
                        <View className="flex-col mb-4">
                            {/* Title Row - HTML: flex justify-between items-start mb-1 */}
                            <View className="flex-row justify-between items-start mb-1">
                                {/* Title - HTML: text-3xl font-serif font-light tracking-tight */}
                                <Text className="flex-1 text-3xl font-light tracking-tight text-onSurface font-serif">
                                    {story.title || 'Untitled Story'}
                                </Text>

                                {/* LISTENING INDICATOR - HTML: text-[10px] uppercase tracking-widest font-bold text-amber-custom */}
                                {isBeingListened && (
                                    <View className="pt-1.5 ml-2">
                                        <Text className="text-[10px] uppercase tracking-widest font-bold text-amber-custom whitespace-nowrap">
                                            {listenerName.toUpperCase()} IS LISTENING
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Date - HTML: text-[20px] font-sans text-gray-500 font-medium tracking-wide */}
                            <Text className="text-xl text-gray-500 font-medium tracking-wide">
                                {fullDateStr}
                            </Text>
                        </View>

                        {/* STORY PREVIEW - HTML: text-[#5c5552] font-display text-lg leading-relaxed mb-6 font-light */}
                        <Text className="text-textFaint text-lg leading-relaxed mb-6 font-light font-serif">
                            {previewText}
                        </Text>

                        {/* Footer: Play button + Duration + Status - HTML: flex items-center justify-between */}
                        <View className="flex-row items-center justify-between">
                            {/* Play Button - HTML: w-14 h-14 rounded-full bg-terracotta-soft */}
                            <Pressable
                                onPress={() => onPlay(story.id)}
                                className="w-14 h-14 rounded-full bg-primary-soft items-center justify-center"
                            >
                                <Ionicons name="play" size={32} color="#C26B4A" style={{ marginLeft: 2 }} />
                            </Pressable>

                            {/* Duration + Status - HTML: flex flex-col items-end gap-1 */}
                            <View className="items-end gap-1">
                                {/* Duration - HTML: text-xs font-sans text-stone-400 font-medium */}
                                <Text className="text-xs text-stone-400 font-medium">
                                    {durationStr}
                                </Text>

                                {/* Sync Status - HTML: flex items-center gap-1.5 */}
                                <View className="flex-row items-center gap-1.5">
                                    {isSynced && (
                                        <>
                                            <Ionicons name="checkmark-circle" size={18} color="#7D9D7A" />
                                            <Text className="text-xs text-stone-500 font-medium">Saved to cloud</Text>
                                        </>
                                    )}
                                    {isSyncing && (
                                        <>
                                            <Ionicons name="cloud-outline" size={18} color="#9CA3AF" />
                                            <Text className="text-xs text-gray-400 font-medium">Waiting for sync...</Text>
                                        </>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </View>
        );
    }

    // Default Compact Card - EXACT HTML match
    return (
        <View className="w-full flex items-center relative mb-6 pt-2">
            {/* Center Timeline Dot - HTML: absolute left-1/2 -translate-x-1/2 top-4 */}
            <View style={[styles.centerDot, { top: 16 }]} />

            <Pressable
                onPress={() => onPlay(story.id)}
                className="w-full bg-white rounded-2xl overflow-hidden relative min-h-[100px] flex-row items-center"
                style={styles.cardShadow}
            >
                {/* Left Accent Bar - HTML: absolute left-0 top-0 bottom-0 w-[4px] bg-terracotta-muted */}
                <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                {/* Content - HTML: p-5 pl-7 pr-5 w-full flex justify-between items-center */}
                <View className="flex-1 p-5 pl-7 pr-5">
                    {/* Year Tag - HTML: text-[11px] font-sans text-stone-400 font-medium tracking-wide mb-1 */}
                    <Text className="text-[11px] text-stone-400 font-medium tracking-wide mb-1">
                        {dateObj.getFullYear()}
                    </Text>

                    {/* Title - HTML: text-xl font-serif font-light text-stone-600 mb-1 */}
                    <Text className="text-xl font-light text-stone-600 mb-1 font-serif">
                        {story.title || 'Untitled Story'}
                    </Text>

                    {/* Full Date - HTML: text-[20px] font-sans text-gray-500 font-medium tracking-wide mb-3 */}
                    <Text className="text-xl text-gray-500 font-medium tracking-wide mb-3">
                        {fullDateStr}
                    </Text>

                    {/* Sync Status - HTML: flex items-center gap-1.5 */}
                    <View className="flex-row items-center gap-1.5">
                        {isSynced && (
                            <>
                                <Ionicons name="checkmark-circle" size={18} color="#7D9D7A" />
                                <Text className="text-xs text-stone-500 font-medium">Saved to cloud</Text>
                            </>
                        )}
                        {isSyncing && (
                            <>
                                <Ionicons name="cloud-outline" size={18} color="#9CA3AF" />
                                <Text className="text-xs text-gray-400 font-medium">Waiting for sync...</Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Play Button on Right - HTML: w-12 h-12 rounded-full bg-terracotta-soft shrink-0 ml-3 */}
                <Pressable
                    onPress={() => onPlay(story.id)}
                    className="w-12 h-12 rounded-full bg-primary-soft items-center justify-center mr-5 shrink-0"
                >
                    <Ionicons name="play" size={28} color="#C26B4A" style={{ marginLeft: 2 }} />
                </Pressable>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    centerDot: {
        position: 'absolute',
        left: '50%',
        marginLeft: -6,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#D6D3D1',
        backgroundColor: '#FFFAF5',
        zIndex: 20,
    },
    accentBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    elevatedShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.06,
        shadowRadius: 30,
        elevation: 8,
    },
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
});

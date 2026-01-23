/**
 * HomeNotification - "Alice liked..." notification card.
 * 
 * Design:
 * - Rounded-2xl container
 * - Left accent border (amber/gold) (w-1.5)
 * - Avatar with white border
 * - "Alice liked..." test
 * - Chevron right
 * - Subtle background color (#FFFDF5)
 * 
 * Matches HTML:
 * <div class="group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border border-amber-border/30 bg-[#FFFDF5] ...">
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeritageTheme } from '@/theme/heritage';

interface HomeNotificationProps {
    onPress: () => void;
    actorName?: string;
    actionText?: string;
    storyTitle?: string;
    avatarUrl?: string;
}

export const HomeNotification = ({
    onPress,
    actorName = "Alice",
    actionText = "liked",
    storyTitle = "My first job",
    avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuC-OqETNsiT8Xqn2RatVrhmvn2NfAD32baNOtlysgZFZvSVZq8DJJmJDywJwTD1M0idINIntiAIRmsX3TtScSrjtv3RZW2tbAoUddvUyMNQO276fWw5CLD3eQZuGskX4yGl507vagE4hZ12a3Wy0wO4olUkt--hZeUFzc5VAqLePuyPbLwbWqNosk2VUpRcJWtZIfckzdChN7VJTlpuxAHRzJ1N9XtPUVjvHulRvKPvjUDxFXjk-Isvv9rsEndnXj4kvNWYj4jWkhw"
}: HomeNotificationProps) => {
    const { colors } = useHeritageTheme();

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={[
                styles.container,
                {
                    backgroundColor: '#FFFDF5', // Specific light cream from design
                    borderColor: 'rgba(212, 160, 18, 0.3)', // Amber border/30
                }
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${actorName} ${actionText} "${storyTitle}". Tap to see details.`}
        >
            {/* Left accent border */}
            <View style={[styles.accentBorder, { backgroundColor: '#D4A012' }]} />

            <View style={styles.content}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: avatarUrl }}
                        style={styles.avatar}
                    />
                </View>

                {/* Text */}
                <View style={styles.textContainer}>
                    <Text style={[styles.mainText, { color: colors.onSurface }]}>
                        {actorName} {actionText} "{storyTitle}".
                    </Text>
                    <Text style={[styles.subText, { color: '#584D49' }]}>
                        Tap to see.
                    </Text>
                </View>
            </View>

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={20} color="#584D49" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16, // p-4
        paddingRight: 12, // pr-3
        borderRadius: 16, // rounded-2xl
        borderWidth: 1,
        overflow: 'hidden',
        // shadow-sm
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        marginTop: 8,
    },
    accentBorder: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 6, // w-1.5
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12, // gap-3
        paddingLeft: 8, // pl-2
    },
    avatarContainer: {
        width: 40, // w-10
        height: 40, // h-10
        borderRadius: 20, // rounded-full
        borderWidth: 2,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
        backgroundColor: 'rgba(194, 107, 74, 0.1)', // primary/10
        // shadow-sm
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 1,
    },
    mainText: {
        fontSize: 14, // text-sm
        fontWeight: '700', // font-bold
        lineHeight: 18, // leading-tight
    },
    subText: {
        fontSize: 14,
        fontWeight: '400', // font-normal
        marginTop: 2,
    },
});

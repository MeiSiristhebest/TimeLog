/**
 * Consent Review Screen
 * 
 * Allows users to view and modify their consent settings.
 */

import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';

type ConsentItem = {
    id: string;
    title: string;
    description: string;
    consentedAt: string;
    icon: keyof typeof MaterialIcons.glyphMap;
};

const CONSENT_ITEMS: ConsentItem[] = [
    {
        id: 'cloud_ai',
        title: 'Cloud AI Processing',
        description: 'Short audio clips are sent to our AI service to generate follow-up questions and transcripts. Full recordings remain local first.',
        consentedAt: '2026-01-15',
        icon: 'psychology',
    },
    {
        id: 'cloud_storage',
        title: 'Cloud Storage',
        description: 'Your stories are backed up to secure cloud storage for safekeeping and family access.',
        consentedAt: '2026-01-15',
        icon: 'cloud-upload',
    },
    {
        id: 'family_sharing',
        title: 'Family Sharing',
        description: 'Connected family members can listen to your stories and leave comments.',
        consentedAt: '2026-01-15',
        icon: 'family-restroom',
    },
];

function ConsentCard({ item }: { item: ConsentItem }) {
    const theme = useHeritageTheme();

    return (
        <View style={[styles.consentCard, { borderColor: theme.colors.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                <MaterialIcons name={item.icon} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                    {item.title}
                </Text>
                <Text style={[styles.cardDescription, { color: `${theme.colors.onSurface}80` }]}>
                    {item.description}
                </Text>
                <View style={styles.consentInfo}>
                    <MaterialIcons name="check-circle" size={16} color="#7D9D7A" />
                    <Text style={styles.consentDate}>Consented on {item.consentedAt}</Text>
                </View>
            </View>
        </View>
    );
}

export default function ConsentReviewScreen() {
    const theme = useHeritageTheme();
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <HeritageHeader
                title="Review Consent"
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
                <Text style={[styles.headerText, { color: theme.colors.onSurface }]}>
                    Your Privacy Choices
                </Text>
                <Text style={[styles.subText, { color: `${theme.colors.onSurface}80` }]}>
                    These are the features you've consented to. You can change these settings anytime in Privacy & Sharing.
                </Text>

                {CONSENT_ITEMS.map((item) => (
                    <ConsentCard key={item.id} item={item} />
                ))}

                <View style={[styles.infoBox, { backgroundColor: `${theme.colors.primary}08` }]}>
                    <MaterialIcons name="info-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
                        To withdraw consent, go to Settings → Privacy & Sharing and toggle off the relevant features.
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
    headerText: {
        fontSize: 24,
        fontFamily: 'Fraunces_600SemiBold',
        marginBottom: 8,
    },
    subText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
    },
    consentCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
        gap: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    consentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    consentDate: {
        fontSize: 13,
        color: '#7D9D7A',
        fontWeight: '500',
    },
    infoBox: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        marginTop: 16,
        alignItems: 'flex-start',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});

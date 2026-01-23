/**
 * Help & FAQ Screen
 * 
 * Provides user assistance and frequently asked questions.
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
    Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';

type FAQItem = {
    id: string;
    question: string;
    answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
    {
        id: '1',
        question: 'How do I start recording a story?',
        answer: 'Go to the Home tab and tap the large red Record button. You can either choose a topic first or start recording right away. The app will guide you with questions.',
    },
    {
        id: '2',
        question: 'Can I record without internet?',
        answer: 'Yes! TimeLog works completely offline. Your recordings are saved locally and will sync to the cloud automatically when you have internet connection.',
    },
    {
        id: '3',
        question: 'How does my family listen to my stories?',
        answer: 'Your family members can link their devices using the Connection Code or QR code in your Settings. Once linked, they can listen to all your stories and leave comments.',
    },
    {
        id: '4',
        question: 'What happens if I delete a story?',
        answer: 'Deleted stories are moved to the "Deleted Items" folder where they stay for 30 days. You can restore them anytime during this period from Settings > Deleted Items.',
    },
    {
        id: '5',
        question: 'How do I turn off cloud features?',
        answer: 'Go to Settings > Privacy & Sharing and toggle off "Cloud AI & Sharing". Your local recordings will continue to work, but stories won\'t sync to the cloud.',
    },
    {
        id: '6',
        question: 'How can my family ask me questions?',
        answer: 'Family members can submit questions from their app. These questions will appear in your Topics tab with a "From Family" tag, so you can record answers directly.',
    },
];

function FAQAccordion({ item }: { item: FAQItem }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const theme = useHeritageTheme();

    return (
        <Pressable
            onPress={() => setIsExpanded(!isExpanded)}
            style={[styles.faqItem, { borderColor: theme.colors.border }]}
        >
            <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: theme.colors.onSurface }]}>
                    {item.question}
                </Text>
                <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color={theme.colors.primary}
                />
            </View>
            {isExpanded && (
                <Text style={[styles.faqAnswer, { color: `${theme.colors.onSurface}CC` }]}>
                    {item.answer}
                </Text>
            )}
        </Pressable>
    );
}

export default function HelpScreen() {
    const theme = useHeritageTheme();
    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const handleContactSupport = () => {
        Linking.openURL('mailto:support@timelog.app?subject=Help%20Request');
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <HeritageHeader
                title="Help & FAQ"
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
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                    Frequently Asked Questions
                </Text>

                {FAQ_ITEMS.map((item) => (
                    <FAQAccordion key={item.id} item={item} />
                ))}

                <View style={styles.contactSection}>
                    <Text style={[styles.contactTitle, { color: theme.colors.onSurface }]}>
                        Still need help?
                    </Text>
                    <Text style={[styles.contactText, { color: `${theme.colors.onSurface}80` }]}>
                        Our support team is here to assist you.
                    </Text>
                    <HeritageButton
                        title="Contact Support"
                        icon="mail"
                        variant="primary"
                        onPress={handleContactSupport}
                        style={{ marginTop: 16 }}
                    />
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
    sectionTitle: {
        fontSize: 22,
        fontFamily: 'Fraunces_600SemiBold',
        marginBottom: 20,
    },
    faqItem: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        paddingRight: 12,
    },
    faqAnswer: {
        fontSize: 15,
        lineHeight: 22,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    contactSection: {
        marginTop: 32,
        padding: 24,
        backgroundColor: 'rgba(234, 119, 77, 0.08)',
        borderRadius: 20,
        alignItems: 'center',
    },
    contactTitle: {
        fontSize: 20,
        fontFamily: 'Fraunces_600SemiBold',
        marginBottom: 8,
    },
    contactText: {
        fontSize: 15,
        textAlign: 'center',
    },
});

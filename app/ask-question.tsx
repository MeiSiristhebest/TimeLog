import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import {
    loadInspirationLibrary,
    submitQuestion,
    type QuestionCategory,
} from '@/features/family-listener/services/questionService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { HeritageAlert } from '@/components/ui/HeritageAlert';

// Heritage
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageInput } from '@/components/ui/heritage/HeritageInput';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

export default function AskQuestionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ seniorUserId?: string }>();
    const sessionUserId = useAuthStore((state) => state.sessionUserId);
    const theme = useHeritageTheme();

    const [categories, setCategories] = useState<QuestionCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<string>('');
    const [customQuestion, setCustomQuestion] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Scroll Animation
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Load inspiration library
    useEffect(() => {
        async function loadLibrary() {
            const library = await loadInspirationLibrary();
            setCategories(library.categories);
            if (library.categories.length > 0) {
                setSelectedCategory(library.categories[0].id);
            }
        }
        loadLibrary();
    }, []);

    // Handle question selection
    const handleSelectQuestion = (question: string) => {
        setSelectedQuestion(question);
        setCustomQuestion(question);
    };

    // Handle submission
    const handleSubmit = async () => {
        if (!customQuestion.trim()) {
            HeritageAlert.show({
                title: 'Missing Question',
                message: 'Please enter a question to send.',
                variant: 'warning',
            });
            return;
        }

        if (!params.seniorUserId || !sessionUserId) {
            HeritageAlert.show({
                title: 'Error',
                message: 'Missing user information.',
                variant: 'error',
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await submitQuestion(customQuestion.trim(), params.seniorUserId, sessionUserId);
            HeritageAlert.show({
                title: 'Sent!',
                message: 'Your question has been sent.',
                variant: 'success',
                primaryAction: {
                    label: 'Done',
                    onPress: () => router.back(),
                },
            });
        } catch (error) {
            console.error('Failed to submit question:', error);
            HeritageAlert.show({
                title: 'Error',
                message: 'Failed to send question. Please try again.',
                variant: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <Stack.Screen options={{ headerShown: false }} />

            <HeritageHeader
                title="Ask a Question"
                showBack
                scrollY={scrollY}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
            />

            <Animated.ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingTop: 100, paddingBottom: 40 }}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                <Text
                    style={{
                        fontSize: 18,
                        color: theme.colors.textMuted,
                        marginBottom: 24,
                        fontFamily: 'System',
                        lineHeight: 26,
                    }}
                >
                    Choose from our suggestions or write your own question to inspire a new story.
                </Text>

                {/* Category Tabs */}
                {categories.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
                        style={{ marginBottom: 24, marginHorizontal: -24, paddingHorizontal: 24 }}
                    >
                        {categories.map((category) => (
                            <HeritageButton
                                key={category.id}
                                title={`${category.icon} ${category.name}`}
                                onPress={() => setSelectedCategory(category.id)}
                                variant={selectedCategory === category.id ? 'primary' : 'secondary'}
                                size="small"
                                style={{
                                    height: 40,
                                    borderRadius: 20,
                                }}
                            />
                        ))}
                    </ScrollView>
                )}

                {/* Questions List */}
                {selectedCategory && (
                    <View style={{ marginBottom: 32 }}>
                        <Text style={{
                            fontSize: 20,
                            fontFamily: 'Fraunces_600SemiBold',
                            marginBottom: 16,
                            color: theme.colors.onSurface
                        }}>
                            Suggestions
                        </Text>
                        <View style={{ gap: 12 }}>
                            {categories
                                .find((c) => c.id === selectedCategory)
                                ?.questions.map((question, index) => (
                                    <Pressable
                                        key={index}
                                        onPress={() => handleSelectQuestion(question)}
                                        style={({ pressed }) => ({
                                            padding: 16,
                                            borderRadius: theme.radius.md,
                                            backgroundColor: selectedQuestion === question
                                                ? `${theme.colors.primary}15`
                                                : theme.colors.surfaceDim,
                                            borderWidth: 1,
                                            borderColor: selectedQuestion === question
                                                ? theme.colors.primary
                                                : 'transparent',
                                            opacity: pressed ? 0.9 : 1,
                                        })}
                                    >
                                        <Text
                                            style={{
                                                fontSize: 16,
                                                color: theme.colors.onSurface,
                                                lineHeight: 24,
                                            }}
                                        >
                                            {question}
                                        </Text>
                                    </Pressable>
                                ))}
                        </View>
                    </View>
                )}

                {/* Custom Question Input */}
                <View style={{ marginBottom: 32 }}>
                    <HeritageInput
                        label="Your Question"
                        value={customQuestion}
                        onChangeText={setCustomQuestion}
                        placeholder="Type your question here..."
                        multiline
                        numberOfLines={4}
                        inputStyle={{ minHeight: 120, textAlignVertical: 'top' }}
                    />
                </View>

                {/* Submit Button */}
                <HeritageButton
                    title={isSubmitting ? 'Sending...' : 'Send Question'}
                    onPress={handleSubmit}
                    disabled={isSubmitting || !customQuestion.trim()}
                    loading={isSubmitting}
                    fullWidth
                    size="large"
                />
            </Animated.ScrollView>
        </View>
    );
}

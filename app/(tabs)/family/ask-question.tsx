import { View, Text, ScrollView, Pressable, TextInput, Modal, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/store/authStore';
import { loadInspirationLibrary, InspirationLibrary } from '@/features/family-listener/services/questionService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useHeritageTheme } from '@/theme/heritage';

export default function AskQuestionScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const userId = useAuthStore((state) => state.sessionUserId);
    const { colors } = useHeritageTheme();

    const [library, setLibrary] = useState<InspirationLibrary | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [questionText, setQuestionText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        const data = await loadInspirationLibrary();
        setLibrary(data);
        if (data.categories.length > 0) {
            setSelectedCategory(data.categories[0].id);
        }
    };

    const handleQuestionSelect = (text: string) => {
        setQuestionText(text);
        setModalVisible(true);
    };

    const handleSubmit = async () => {
        if (!questionText.trim()) return;
        if (!userId) return;

        setIsSubmitting(true);
        try {
            // Simulate success for UI demo
            await new Promise(resolve => setTimeout(resolve, 1000));

            HeritageAlert.show({
                title: 'Sent!',
                message: 'Your question has been sent.',
                variant: 'success',
                primaryAction: {
                    label: 'Done',
                    onPress: () => {
                        setModalVisible(false);
                        setQuestionText('');
                        router.back();
                    },
                },
            });
        } catch (error) {
            HeritageAlert.show({
                title: 'Error',
                message: 'Failed to send question. Please try again.',
                variant: 'error',
            });
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeCategory = library?.categories.find(c => c.id === selectedCategory);

    return (
        <View style={[styles.container, { backgroundColor: colors.surfaceDim }]}>
            {/* Header */}
            <View style={[styles.header, {
                paddingTop: insets.top,
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
            }]}>
                <View style={styles.headerContent}>
                    <Pressable onPress={() => router.back()} hitSlop={20}>
                        <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                        Ask a Question
                    </Text>
                    <View style={{ width: 24 }} />
                </View>
            </View>

            <View style={{ flex: 1 }}>
                {/* Category Tabs */}
                <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabScroll}
                    >
                        {library?.categories.map((category) => (
                            <Pressable
                                key={category.id}
                                onPress={() => setSelectedCategory(category.id)}
                                style={[styles.tab, {
                                    backgroundColor: selectedCategory === category.id ? colors.primary : 'transparent',
                                    borderColor: selectedCategory === category.id ? colors.primary : colors.border,
                                }]}
                            >
                                <Text style={{
                                    color: selectedCategory === category.id ? colors.onPrimary : colors.onSurface,
                                    fontWeight: '500'
                                }}>
                                    {category.icon} {category.name.split(' ')[0]}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                {/* Questions Grid */}
                <ScrollView contentContainerStyle={styles.listContent}>
                    <Text style={[styles.categoryTitle, { color: colors.onSurface }]}>
                        {activeCategory?.name}
                    </Text>

                    {activeCategory?.questions.map((q, index) => (
                        <Pressable
                            key={index}
                            onPress={() => handleQuestionSelect(q)}
                            style={({ pressed }) => ([styles.questionCard, {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                shadowColor: colors.primary,
                                opacity: pressed ? 0.9 : 1,
                            }])}
                        >
                            <Text style={[styles.questionText, { color: colors.onSurface }]}>
                                {q}
                            </Text>
                            <View style={styles.useButton}>
                                <Text style={{ color: colors.primary, fontWeight: '600' }}>Use this ›</Text>
                            </View>
                        </Pressable>
                    ))}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>

            {/* Floating Action Button for Custom Question */}
            <Pressable
                onPress={() => {
                    setQuestionText('');
                    setModalVisible(true);
                }}
                style={({ pressed }) => ([styles.fab, {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                    opacity: pressed ? 0.9 : 1,
                }])}
            >
                <Ionicons name="pencil" size={20} color={colors.onPrimary} />
                <Text style={[styles.fabText, { color: colors.onPrimary }]}>Write Custom</Text>
            </Pressable>

            {/* Edit/Send Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, {
                        backgroundColor: colors.surface,
                        paddingBottom: insets.bottom + 24,
                    }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                                Send Question
                            </Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={32} color={colors.border} />
                            </Pressable>
                        </View>

                        <TextInput
                            multiline
                            value={questionText}
                            onChangeText={setQuestionText}
                            placeholder="What would you like to ask?"
                            placeholderTextColor={colors.handle}
                            style={[styles.input, {
                                backgroundColor: colors.surfaceDim,
                                color: colors.onSurface,
                                borderColor: colors.border,
                            }]}
                            autoFocus
                        />

                        <Pressable
                            onPress={handleSubmit}
                            disabled={isSubmitting || !questionText.trim()}
                            style={[styles.submitButton, {
                                backgroundColor: colors.primary,
                                shadowColor: colors.primary,
                                opacity: (isSubmitting || !questionText.trim()) ? 0.6 : 1,
                            }]}
                        >
                            <Text style={[styles.submitText, { color: colors.onPrimary }]}>
                                {isSubmitting ? 'Sending...' : 'Send to Family'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Fraunces_600SemiBold',
    },
    tabContainer: {
        height: 60,
    },
    tabScroll: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    tab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    listContent: {
        padding: 16,
    },
    categoryTitle: {
        fontSize: 24,
        fontFamily: 'Fraunces_600SemiBold',
        marginBottom: 16,
    },
    questionCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    questionText: {
        fontSize: 18,
        lineHeight: 26,
    },
    useButton: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    fabText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: 'Fraunces_600SemiBold',
    },
    input: {
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        minHeight: 120,
        textAlignVertical: 'top',
        marginBottom: 20,
        borderWidth: 1,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    submitText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});


import { Ionicons } from '@/components/ui/Icon';
import { updateStoryMetadata } from '../services/storyService';
import { devLog } from '@/lib/devLogger';
import { TOPIC_QUESTIONS } from '@/features/recorder/data/topicQuestions';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { View, TextInput, Pressable, ScrollView } from 'react-native';

interface EditStorySheetProps {
    isVisible: boolean;
    onClose: () => void;
    storyId: string;
    initialTitle: string;
    initialTopicId?: string;
    onSuccess?: () => void;
}

/**
 * EditStorySheet: A comprehensive modal for editing story details.
 * Replaces EditTitleSheet.
 */
export function EditStorySheet({
    isVisible,
    onClose,
    storyId,
    initialTitle,
    initialTopicId,
    onSuccess,
}: EditStorySheetProps) {
    const { colors } = useHeritageTheme();

    const [title, setTitle] = useState(initialTitle);
    const [topicId, setTopicId] = useState(initialTopicId);
    const [transcript, setTranscript] = useState('Transcript is not available yet.');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derive categories from TOPIC_QUESTIONS
    const categories = Array.from(new Set(TOPIC_QUESTIONS.map(q => q.category)));

    const currentQuestion = TOPIC_QUESTIONS.find(q => q.id === topicId);
    const currentCategory = currentQuestion?.category;

    useEffect(() => {
        if (isVisible) {
            setTitle(initialTitle || '');
            setTopicId(initialTopicId);
            setError(null);
            setIsSaving(false);
        }
    }, [isVisible, initialTitle, initialTopicId]);

    const handleSave = async () => {
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setError('Title cannot be empty');
            return;
        }

        try {
            setIsSaving(true);
            setError(null);

            await updateStoryMetadata(storyId, {
                title: trimmedTitle,
                topicId: topicId
            });

            if (onSuccess) {
                onSuccess();
            }
            onClose();
        } catch (err) {
            devLog.error('Failed to save story details:', err);
            setError('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-end">
                <Pressable
                    className="absolute inset-0 bg-black/40"
                    onPress={onClose}
                />

                <View
                    className="rounded-t-3xl h-[85%] shadow-xl elevation-10"
                    style={{ backgroundColor: colors.surface }}>
                    {/* Header */}
                    <View
                        className="flex-row justify-between items-center p-6 border-b"
                        style={{ borderBottomColor: 'rgba(0,0,0,0.1)' }}>
                        <AppText
                            className="text-xl"
                            style={{ fontFamily: 'Fraunces_600SemiBold', color: colors.onSurface }}>
                            Edit Story
                        </AppText>
                        <Pressable onPress={onClose} hitSlop={12}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={{ padding: 24, gap: 24 }}>
                        {/* Title Section */}
                        <View className="gap-2">
                            <AppText
                                className="text-sm font-semibold mb-1"
                                style={{ color: colors.textMuted }}>
                                Title
                            </AppText>
                            <TextInput
                                className="border rounded-xl p-4 text-base"
                                style={{
                                    backgroundColor: colors.surfaceDim,
                                    color: colors.onSurface,
                                    borderColor: colors.border,
                                }}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Story Title"
                                placeholderTextColor={colors.disabledText}
                            />
                        </View>

                        {/* Category / Cover Section */}
                        <View className="gap-2">
                            <AppText
                                className="text-sm font-semibold mb-1"
                                style={{ color: colors.textMuted }}>
                                Topic Category (Changes Cover)
                            </AppText>
                            <View className="flex-row flex-wrap gap-2">
                                {categories.map(cat => {
                                    const repQ = TOPIC_QUESTIONS.find(q => q.category === cat);
                                    const isSelected = currentCategory === cat;

                                    if (!repQ) return null;

                                    return (
                                        <Pressable
                                            key={cat}
                                            className="px-4 py-2 rounded-full border"
                                            style={{
                                                backgroundColor: isSelected ? colors.primary : colors.surfaceDim,
                                                borderColor: isSelected ? colors.primary : colors.border
                                            }}
                                            onPress={() => setTopicId(repQ.id)}>
                                            <AppText
                                                className="text-sm font-medium"
                                                style={{ color: isSelected ? colors.onPrimary : colors.textMuted }}>
                                                {cat ? cat.charAt(0).toUpperCase() + cat.slice(1) : 'Other'}
                                            </AppText>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Transcript Section (Placeholder) */}
                        <View className="gap-2">
                            <AppText
                                className="text-sm font-semibold mb-1"
                                style={{ color: colors.textMuted }}>
                                Transcript
                            </AppText>
                            <TextInput
                                className="border rounded-xl p-4 text-base h-[120px] align-top"
                                style={{
                                    backgroundColor: colors.surfaceDim,
                                    color: colors.onSurface,
                                    borderColor: colors.border,
                                    textAlignVertical: 'top' // Android support
                                }}
                                value={transcript}
                                onChangeText={setTranscript}
                                multiline
                                editable={false}
                                placeholder="Transcript..."
                            />
                            <AppText
                                className="text-xs italic"
                                style={{ color: colors.disabledText }}>
                                Transcript editing coming soon.
                            </AppText>
                        </View>

                        {error ? (
                            <AppText
                                className="text-sm"
                                style={{ color: colors.error || '#B84A4A' }}>
                                {error}
                            </AppText>
                        ) : null}

                        <Pressable
                            className="py-[18px] rounded-full items-center mt-2 mb-10"
                            style={{
                                backgroundColor: colors.primary,
                                opacity: !title.trim() || isSaving ? 0.6 : 1,
                            }}
                            onPress={handleSave}
                            disabled={!title.trim() || isSaving}>
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <AppText
                                    className="text-[17px] font-semibold"
                                    style={{ color: colors.onPrimary }}>
                                    Save Changes
                                </AppText>
                            )}
                        </Pressable>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

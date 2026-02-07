import React, { useState, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { Icon } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import { useStory } from '@/features/story-gallery/hooks/useStory';
import { updateStoryMetadata } from '@/features/story-gallery/services/storyService';
import { showErrorToast, showSuccessToast } from '@/components/ui/feedback/toast';
import { CATEGORY_COVERS } from '@/features/story-gallery/utils/storyImageUtils';
import { Platform } from 'react-native';
import { View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Pressable } from 'react-native';

// Helper for spring animations
function SpringAction({ children, onPress, disabled, style }: any) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            onPressIn={() => !disabled && (scale.value = withSpring(0.96, { damping: 10, stiffness: 300 }))}
            onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}
            style={style}
        >
            <Animated.View style={animatedStyle}>
                {children}
            </Animated.View>
        </Pressable>
    );
}

export default function StoryEditScreen(): JSX.Element {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { story, isLoading } = useStory(id);
    const theme = useHeritageTheme();
    const { colors } = theme;

    const [title, setTitle] = useState('');
    const [transcription, setTranscription] = useState('');
    const [coverUri, setCoverUri] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize state when story loads
    useEffect(() => {
        if (story) {
            setTitle(story.title || '');
            // Use stored transcription or fallback to mock placeholder text if empty/null
            setTranscription(story.transcription || '');
            setCoverUri(story.coverImagePath || null);
        }
    }, [story]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            setCoverUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!id) return;
        setIsSaving(true);
        try {
            // If transcription is still empty/placeholder, don't save it unless changed
            const updates: any = { title };
            if (transcription !== story?.transcription) updates.transcription = transcription;
            if (coverUri !== story?.coverImagePath) updates.coverImagePath = coverUri;

            await updateStoryMetadata(id, updates);
            showSuccessToast('Story updated');
            router.back();
        } catch (e) {
            showErrorToast('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !story) {
        return <View style={{ flex: 1, backgroundColor: colors.surface }} />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        paddingTop: 8,
                        paddingBottom: 12,
                    }}>
                    <SpringAction onPress={() => router.back()}>
                        <AppText style={{ color: colors.primary, fontSize: 17 }}>Cancel</AppText>
                    </SpringAction>
                    <SpringAction onPress={handleSave} disabled={isSaving}>
                        <AppText style={{ color: isSaving ? colors.textMuted : colors.primary, fontWeight: '600', fontSize: 17 }}>
                            {isSaving ? 'Saving' : 'Save'}
                        </AppText>
                    </SpringAction>
                </View>
            </SafeAreaView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
            >
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

                    {/* Cover Image Section */}
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                        <SpringAction
                            onPress={handlePickImage}
                            style={{
                                width: 160,
                                height: 160,
                                borderRadius: 16,
                                overflow: 'hidden',
                                backgroundColor: colors.surfaceDim,
                                position: 'relative',
                                borderWidth: 1,
                                borderColor: colors.border
                            }}
                        >
                            {coverUri ? (
                                <Image source={{ uri: coverUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                            ) : (
                                // Default Category Image Preview
                                <Image source={CATEGORY_COVERS.all} style={{ width: '100%', height: '100%', opacity: 0.6 }} contentFit="cover" />
                            )}

                            {/* Overlay */}
                            <View style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.3)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
                            }}>
                                <Icon name="camera" size={24} color="#FFF" />
                                <AppText style={{ color: '#FFF', fontWeight: '600', fontSize: 12 }}>Change Cover</AppText>
                            </View>
                        </SpringAction>
                    </View>

                    {/* Title Input */}
                    <View style={{ marginBottom: 24 }}>
                        <AppText style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>
                            Title
                        </AppText>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            style={{
                                fontSize: 20,
                                color: colors.onSurface,
                                fontFamily: 'Fraunces_600SemiBold',
                                borderBottomWidth: 1,
                                borderBottomColor: colors.border,
                                paddingVertical: 8
                            }}
                            placeholder="Story Title"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    {/* Transcript Editor */}
                    <View style={{ flex: 1 }}>
                        <AppText style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>
                            Transcript
                        </AppText>
                        <View style={{
                            backgroundColor: colors.surfaceDim, // Input background
                            borderRadius: 12,
                            padding: 16,
                            minHeight: 200
                        }}>
                            <TextInput
                                value={transcription}
                                onChangeText={setTranscription}
                                multiline
                                scrollEnabled={false} // Grow with content
                                style={{
                                    fontSize: 16,
                                    lineHeight: 24,
                                    color: colors.onSurface,
                                    textAlignVertical: 'top'
                                }}
                                placeholder="Transcript text will appear here..."
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <AppText style={{ marginTop: 8, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
                            Edit the text to fix any transcription errors.
                        </AppText>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

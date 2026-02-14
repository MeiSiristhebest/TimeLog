import React, { useEffect, useMemo, useState } from 'react';
import { Animated } from '@/tw/animated';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useHeritageTheme } from '@/theme/heritage';
import { useStory } from '@/features/story-gallery/hooks/useStory';
import {
  useStoryTranscript,
  type TranscriptEntry,
  type TranscriptSpeaker,
} from '@/features/story-gallery/hooks/useStoryTranscript';
import { updateStoryMetadata } from '@/features/story-gallery/services/storyService';
import { showErrorToast, showSuccessToast } from '@/components/ui/feedback/toast';
import { CATEGORY_COVERS } from '@/features/story-gallery/utils/storyImageUtils';
import { getQuestionById, TOPIC_QUESTIONS } from '@/features/recorder/data/topicQuestions';
import { CATEGORY_DATA, mapRawCategoryToFilter } from '@/features/story-gallery/data/mockGalleryData';
import { Platform, View, ScrollView, TextInput, KeyboardAvoidingView, Pressable, Modal } from 'react-native';

type SpringActionProps = {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: object;
};

function SpringAction({ children, onPress, disabled = false, style }: SpringActionProps): JSX.Element {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() =>
        !disabled && (scale.value = withSpring(0.96, { damping: 10, stiffness: 300 }))
      }
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
      }}
      style={style}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

type EditableTranscriptEntry = {
  id: string;
  speaker: TranscriptSpeaker;
  text: string;
};

type TopicCategory = NonNullable<(typeof TOPIC_QUESTIONS)[number]['category']>;

const TOPIC_CATEGORIES: TopicCategory[] = Array.from(
  new Set(
    TOPIC_QUESTIONS.map((item) => item.category).filter(
      (category): category is TopicCategory => Boolean(category)
    )
  )
);

function toCategoryLabel(category?: TopicCategory): string {
  if (!category) return 'General';
  const filterId = mapRawCategoryToFilter(category);
  return CATEGORY_DATA.find((item) => item.id === filterId)?.label ?? category;
}

function speakerMeta(
  speaker: TranscriptSpeaker,
  colors: ReturnType<typeof useHeritageTheme>['colors']
): { label: string; tint: string; bg: string } {
  if (speaker === 'agent') {
    return {
      label: 'AI',
      tint: colors.tertiary,
      bg: `${colors.tertiary}14`,
    };
  }

  if (speaker === 'user') {
    return {
      label: 'You',
      tint: colors.primaryDeep,
      bg: `${colors.primary}16`,
    };
  }

  return {
    label: 'Transcript',
    tint: colors.textMuted,
    bg: `${colors.textMuted}12`,
  };
}

function toEditableEntries(entries: TranscriptEntry[], fallbackTranscript: string): EditableTranscriptEntry[] {
  if (entries.length > 0) {
    return entries.map((entry, index) => ({
      id: entry.id || `entry-${index}`,
      speaker: entry.speaker,
      text: entry.text,
    }));
  }

  const raw = fallbackTranscript.trim();
  if (!raw) {
    return [{ id: 'entry-0', speaker: 'user', text: '' }];
  }

  return raw
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk, index) => {
      const match = chunk.match(/^(AI|Assistant|Agent|You|User|Human)\s*[:：]\s*(.+)$/i);
      if (!match) {
        return {
          id: `entry-${index}`,
          speaker: 'unknown' as const,
          text: chunk,
        };
      }

      const label = match[1].toLowerCase();
      const speaker: TranscriptSpeaker =
        label === 'ai' || label === 'assistant' || label === 'agent' ? 'agent' : 'user';

      return {
        id: `entry-${index}`,
        speaker,
        text: match[2].trim(),
      };
    });
}

function serializeTranscriptEntries(entries: EditableTranscriptEntry[]): string {
  return entries
    .map((entry) => ({ ...entry, text: entry.text.trim() }))
    .filter((entry) => entry.text.length > 0)
    .map((entry) => {
      if (entry.speaker === 'agent') return `AI: ${entry.text}`;
      if (entry.speaker === 'user') return `You: ${entry.text}`;
      return entry.text;
    })
    .join('\n\n')
    .trim();
}

export default function StoryEditScreen(): JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { story, isLoading } = useStory(id);
  const { transcript: transcriptFallback, entries } = useStoryTranscript(id, story?.transcription ?? null);
  const theme = useHeritageTheme();
  const { colors } = theme;
  const question = useMemo(() => (story?.topicId ? getQuestionById(story.topicId) : null), [story?.topicId]);

  const [title, setTitle] = useState('');
  const [editableEntries, setEditableEntries] = useState<EditableTranscriptEntry[]>([]);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [topicId, setTopicId] = useState('');
  const [topicQuery, setTopicQuery] = useState('');
  const [topicPickerVisible, setTopicPickerVisible] = useState(false);
  const [storyDate, setStoryDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hydratedStoryId, setHydratedStoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!story) return;
    if (hydratedStoryId === story.id) return;

    setTitle(story.title || 'Untitled Story');
    const fallback = story.transcription?.trim() ? story.transcription : transcriptFallback;
    setEditableEntries(toEditableEntries(entries, fallback));
    setCoverUri(story.coverImagePath || null);
    setTopicId(story.topicId || '');
    setTopicQuery(
      story.topicId
        ? toCategoryLabel(getQuestionById(story.topicId)?.category as TopicCategory | undefined)
        : ''
    );
    setStoryDate(new Date(story.startedAt));
    setHydratedStoryId(story.id);
  }, [entries, hydratedStoryId, question?.text, story, transcriptFallback]);

  useEffect(() => {
    if (!story) return;
    if (editableEntries.length > 0) return;
    if (!transcriptFallback.trim()) return;
    setEditableEntries(toEditableEntries(entries, transcriptFallback));
  }, [editableEntries.length, entries, story, transcriptFallback]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setCoverUri(result.assets[0].uri);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setStoryDate(selectedDate);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const serializedTranscript = serializeTranscriptEntries(editableEntries);
      await updateStoryMetadata(id, {
        title: title.trim() || 'Untitled Story',
        transcription: serializedTranscript,
        coverImagePath: coverUri || undefined,
        topicId: topicId.trim() || undefined,
        startedAt: storyDate.getTime(),
      });
      showSuccessToast('Story updated');
      router.back();
    } catch {
      showErrorToast('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedTopic = topicId ? getQuestionById(topicId) : undefined;
  const selectedCategory = selectedTopic?.category as TopicCategory | undefined;
  const visibleCategories = TOPIC_CATEGORIES.filter((category) => {
    const query = topicQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }
    const label = toCategoryLabel(category).toLowerCase();
    return label.includes(query) || category.toLowerCase().includes(query);
  });

  const handleCategorySelect = (nextCategory: TopicCategory) => {
    const currentCategory = selectedCategory;
    if (currentCategory === nextCategory) {
      setTopicQuery(toCategoryLabel(nextCategory));
      setTopicPickerVisible(false);
      return;
    }

    const nextTopic = TOPIC_QUESTIONS.find((item) => item.category === nextCategory);
    if (nextTopic) {
      setTopicId(nextTopic.id);
    }
    setTopicQuery(toCategoryLabel(nextCategory));
    setTopicPickerVisible(false);
  };

  const updateTranscriptEntry = (entryId: string, text: string) => {
    setEditableEntries((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, text } : entry))
    );
  };

  const addTranscriptEntry = (speaker: TranscriptSpeaker) => {
    setEditableEntries((prev) => [
      ...prev,
      {
        id: `entry-${Date.now()}-${prev.length}`,
        speaker,
        text: '',
      },
    ]);
  };

  const removeTranscriptEntry = (entryId: string) => {
    setEditableEntries((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((entry) => entry.id !== entryId);
    });
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
            <AppText
              style={{ color: isSaving ? colors.textMuted : colors.primary, fontWeight: '600', fontSize: 17 }}>
              {isSaving ? 'Saving' : 'Save'}
            </AppText>
          </SpringAction>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
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
                borderColor: colors.border,
              }}>
              {coverUri ? (
                <Image
                  source={{ uri: coverUri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <Image
                  source={CATEGORY_COVERS.all}
                  style={{ width: '100%', height: '100%', opacity: 0.6 }}
                  contentFit="cover"
                />
              )}

              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                <Icon name="camera" size={24} color="#FFF" />
                <AppText style={{ color: '#FFF', fontWeight: '600', fontSize: 12 }}>Change Cover</AppText>
              </View>
            </SpringAction>
          </View>

          <View style={{ marginBottom: 24 }}>
            <AppText
              style={{
                color: colors.textMuted,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>
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
                paddingVertical: 8,
              }}
              placeholder="Story Title"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={{ marginBottom: 24 }}>
            <AppText
              style={{
                color: colors.textMuted,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>
              Story Date
            </AppText>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 14,
                backgroundColor: colors.surfaceCard,
              }}>
              <AppText style={{ color: colors.onSurface, fontSize: 16 }}>
                {storyDate.toLocaleDateString()}
              </AppText>
            </Pressable>
          </View>

          <View style={{ marginBottom: 24 }}>
            <AppText
              style={{
                color: colors.textMuted,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>
              Topic
            </AppText>
            <Pressable
              onPress={() => setTopicPickerVisible(true)}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                backgroundColor: colors.surfaceCard,
              }}>
              <AppText style={{ color: selectedCategory ? colors.onSurface : colors.textMuted, fontSize: 16 }}>
                {selectedCategory ? toCategoryLabel(selectedCategory) : 'Select a topic'}
              </AppText>
              {selectedTopic ? (
                <AppText style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>
                  {toCategoryLabel(selectedCategory)}
                </AppText>
              ) : null}
            </Pressable>
          </View>

          <View style={{ flex: 1 }}>
            <AppText
              style={{
                color: colors.textMuted,
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}>
              Transcript
            </AppText>
            <View style={{ gap: 10 }}>
              {editableEntries.map((entry, index) => {
                const meta = speakerMeta(entry.speaker, colors);
                return (
                  <View
                    key={entry.id}
                    style={{
                      backgroundColor: meta.bg,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: `${meta.tint}30`,
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}>
                      <AppText
                        style={{
                          color: meta.tint,
                          fontSize: 12,
                          fontWeight: '700',
                          letterSpacing: 0.4,
                          textTransform: 'uppercase',
                        }}>
                        {meta.label}
                      </AppText>
                      {editableEntries.length > 1 ? (
                        <Pressable onPress={() => removeTranscriptEntry(entry.id)} style={{ paddingHorizontal: 6 }}>
                          <AppText style={{ color: colors.textMuted, fontSize: 12 }}>Remove</AppText>
                        </Pressable>
                      ) : null}
                    </View>
                    <TextInput
                      value={entry.text}
                      onChangeText={(text) => updateTranscriptEntry(entry.id, text)}
                      multiline
                      scrollEnabled={false}
                      style={{
                        fontSize: 16,
                        lineHeight: 24,
                        color: colors.onSurface,
                        textAlignVertical: 'top',
                        minHeight: index === editableEntries.length - 1 ? 72 : 64,
                      }}
                      placeholder={`${meta.label} transcript...`}
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                );
              })}
            </View>

            <View style={{ marginTop: 10, flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => addTranscriptEntry('user')}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: `${colors.primary}66`,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: `${colors.primary}12`,
                }}>
                <AppText style={{ color: colors.primaryDeep, fontSize: 13, fontWeight: '700' }}>
                  + Add You
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => addTranscriptEntry('agent')}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: `${colors.tertiary}66`,
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: `${colors.tertiary}12`,
                }}>
                <AppText style={{ color: colors.tertiary, fontSize: 13, fontWeight: '700' }}>
                  + Add AI
                </AppText>
              </Pressable>
            </View>

            <AppText style={{ marginTop: 8, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
              Keep one paragraph per line. The saved transcript will preserve speaker roles.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker ? (
        <DateTimePicker
          value={storyDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={handleDateChange}
        />
      ) : null}

      <Modal visible={topicPickerVisible} transparent animationType="slide" onRequestClose={() => setTopicPickerVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 24,
              maxHeight: '75%',
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Pressable onPress={() => setTopicPickerVisible(false)} style={{ paddingVertical: 8, paddingHorizontal: 4 }}>
                <AppText style={{ color: colors.textMuted }}>Cancel</AppText>
              </Pressable>
              <AppText style={{ color: colors.onSurface, fontSize: 16, fontWeight: '700' }}>Select Topic</AppText>
              <View style={{ width: 56 }} />
            </View>

            <TextInput
              value={topicQuery}
              onChangeText={setTopicQuery}
              placeholder="Search topic category"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.onSurface,
                marginBottom: 12,
              }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              {visibleCategories.map((category) => {
                const selected = category === selectedCategory;
                const promptCount = TOPIC_QUESTIONS.filter((item) => item.category === category).length;
                return (
                  <Pressable
                    key={category}
                    onPress={() => handleCategorySelect(category)}
                    style={{
                      borderWidth: 1,
                      borderColor: selected ? `${colors.primary}66` : colors.border,
                      backgroundColor: selected ? `${colors.primary}12` : colors.surfaceCard,
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      marginBottom: 8,
                    }}>
                    <AppText style={{ color: colors.onSurface, fontSize: 15, lineHeight: 22 }}>
                      {toCategoryLabel(category)}
                    </AppText>
                    <AppText style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                      {category} · {promptCount} prompts
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

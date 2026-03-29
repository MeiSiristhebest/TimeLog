import { AppText } from '@/components/ui/AppText';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
  FlatList,
  type ListRenderItem,
} from 'react-native';
import { Animated } from '@/tw/animated';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  loadInspirationLibrary,
  InspirationLibrary,
  submitQuestion,
} from '@/features/family-listener/services/questionService';
import { fetchLinkedSeniorStories } from '@/features/family-listener/services/familyStoryService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { useHeritageTheme } from '@/theme/heritage';
import { devLog } from '@/lib/devLogger';
import { mmkv } from '@/lib/mmkv';

// Helper Components for Animations
type Category = InspirationLibrary['categories'][number];
type ThemeColors = ReturnType<typeof useHeritageTheme>['colors'];
const LAST_SELECTED_SENIOR_KEY = 'timelog.family.last_senior_user_id';

function SpringTab({
  category,
  isSelected,
  onPress,
  colors,
}: {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.95, { damping: 10, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}>
      <Animated.View
        className="px-4 py-2 rounded-[20px] mr-2 border"
        style={[
          {
            backgroundColor: isSelected ? colors.primary : 'transparent',
            borderColor: isSelected ? colors.primary : colors.border,
          },
          animatedStyle,
        ]}>
        <AppText
          className="font-medium"
          style={{
            color: isSelected ? colors.onPrimary : colors.onSurface,
          }}>
          {category.icon} {category.name.split(' ')[0]}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

function SpringQuestionCard({
  item,
  onPress,
  colors,
}: {
  item: string;
  onPress: () => void;
  colors: ThemeColors;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.98, { damping: 10, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}>
      <Animated.View
        className="p-5 rounded-2xl mb-3 border shadow-sm"
        style={[
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.primary,
          },
          animatedStyle,
        ]}>
        <AppText className="text-lg leading-[26px]" style={{ color: colors.onSurface }}>
          {item}
        </AppText>
        <View className="flex-row justify-end mt-3">
          <AppText className="font-semibold" style={{ color: colors.primary }}>
            Use this ›
          </AppText>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function AskQuestionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ seniorUserId?: string }>();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.sessionUserId);
  const { colors } = useHeritageTheme();
  const seniorUserId = Array.isArray(params.seniorUserId)
    ? params.seniorUserId[0]
    : params.seniorUserId;

  const [library, setLibrary] = useState<InspirationLibrary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [availableSeniorIds, setAvailableSeniorIds] = useState<string[]>([]);
  const [resolvedSeniorUserId, setResolvedSeniorUserId] = useState<string | null>(null);
  const [isResolvingSenior, setIsResolvingSenior] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function safeLoadLibrary(): Promise<void> {
      try {
        const data = await loadInspirationLibrary();
        if (isCancelled) return;

        setLibrary(data);
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id);
        }
      } catch (error) {
        if (isCancelled) return;

        devLog.error('[AskQuestionScreen] Failed to load inspiration library:', error);
        HeritageAlert.show({
          title: 'Unable to Load Questions',
          message: 'Please try again in a moment.',
          variant: 'error',
        });
      }
    }

    void safeLoadLibrary();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function resolveSeniorTarget(): Promise<void> {
      if (seniorUserId) {
        setResolvedSeniorUserId(seniorUserId);
        setAvailableSeniorIds([seniorUserId]);
        mmkv.set(LAST_SELECTED_SENIOR_KEY, seniorUserId);
        return;
      }

      setIsResolvingSenior(true);
      try {
        const stories = await fetchLinkedSeniorStories();
        if (isCancelled) return;

        const seniorIds = Array.from(new Set(stories.map((story) => story.seniorUserId)));
        setAvailableSeniorIds(seniorIds);

        if (seniorIds.length === 1) {
          setResolvedSeniorUserId(seniorIds[0]);
          mmkv.set(LAST_SELECTED_SENIOR_KEY, seniorIds[0]);
          return;
        }

        const recentSeniorId = mmkv.getString(LAST_SELECTED_SENIOR_KEY);
        if (recentSeniorId && seniorIds.includes(recentSeniorId)) {
          setResolvedSeniorUserId(recentSeniorId);
          return;
        }

        setResolvedSeniorUserId(null);
      } catch (error) {
        if (!isCancelled) {
          devLog.error('[AskQuestionScreen] Failed to resolve senior target:', error);
          setResolvedSeniorUserId(null);
          setAvailableSeniorIds([]);
        }
      } finally {
        if (!isCancelled) {
          setIsResolvingSenior(false);
        }
      }
    }

    void resolveSeniorTarget();
    return () => {
      isCancelled = true;
    };
  }, [seniorUserId]);

  const selectSenior = useCallback((id: string) => {
    setResolvedSeniorUserId(id);
    mmkv.set(LAST_SELECTED_SENIOR_KEY, id);
  }, []);

  const handleQuestionSelect = useCallback((text: string) => {
    setQuestionText(text);
    setModalVisible(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!questionText.trim()) return;
    if (!userId) return;
    if (!resolvedSeniorUserId) {
      HeritageAlert.show({
        title: 'Unable to Send',
        message:
          availableSeniorIds.length > 1
            ? 'Please select which senior should receive this question.'
            : 'No linked senior found yet. Ask from a shared story after linking.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitQuestion(
        questionText.trim(),
        resolvedSeniorUserId,
        userId,
        selectedCategory ?? undefined
      );

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
      devLog.error('[AskQuestionScreen] Failed to send question:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    availableSeniorIds.length,
    questionText,
    resolvedSeniorUserId,
    router,
    selectedCategory,
    userId,
  ]);

  const activeCategory = library?.categories.find((c) => c.id === selectedCategory);
  const questions = useMemo(() => activeCategory?.questions ?? [], [activeCategory]);

  const renderQuestion = useCallback<ListRenderItem<string>>(
    ({ item }) => (
      <SpringQuestionCard item={item} onPress={() => handleQuestionSelect(item)} colors={colors} />
    ),
    [colors, handleQuestionSelect]
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surfaceDim }}>
      {/* Header */}
      <View
        className="px-5 pb-5 border-b"
        style={{
          paddingTop: insets.top,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }}>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} hitSlop={20}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
          <AppText variant="title" className="font-serif" style={{ color: colors.onSurface }}>
            Ask a Question
          </AppText>
          <View className="w-6" />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {/* Category Tabs */}
        <View className="h-[60px]" style={{ backgroundColor: colors.surface }}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center' }}>
            {library?.categories.map((category) => (
              <SpringTab
                key={category.id}
                category={category}
                isSelected={selectedCategory === category.id}
                onPress={() => setSelectedCategory(category.id)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>

        {availableSeniorIds.length > 1 && (
          <View
            className="border-b px-4 pb-3 pt-1"
            style={{ backgroundColor: colors.surface, borderBottomColor: colors.border }}>
            <AppText
              variant="small"
              className="font-semibold mb-2"
              style={{ color: colors.onSurface }}>
              Send to
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableSeniorIds.map((id, index) => {
                const isSelected = id === resolvedSeniorUserId;
                const shortId = id.length > 12 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => selectSenior(id)}
                    className="border rounded-full px-3 py-2 mr-2"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.surfaceDim,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }}>
                    <AppText style={{ color: isSelected ? colors.onPrimary : colors.onSurface }}>
                      {`Senior ${index + 1} (${shortId})`}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Questions Grid */}
        <FlatList
          data={questions}
          keyExtractor={(item, index) => `${selectedCategory ?? 'none'}-${index}`}
          renderItem={renderQuestion}
          contentContainerStyle={{ padding: 16 }}
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={
            <AppText variant="headline" className="mb-4" style={{ color: colors.onSurface }}>
              {activeCategory?.name}
            </AppText>
          }
          ListFooterComponent={<View style={{ height: 40 }} />}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Floating Action Button for Custom Question */}
      <SpringFab
        onPress={() => {
          setQuestionText('');
          setModalVisible(true);
        }}
        color={colors.primary}
        label="Write Custom"
      />      {/* Edit/Send Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="rounded-t-3xl p-6"
            style={{
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 24,
            }}>
            <View className="flex-row justify-between items-center mb-5">
              <AppText variant="headline" style={{ color: colors.onSurface }}>
                Send Question
              </AppText>
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
              className="rounded-xl p-4 text-lg min-h-[120px] mb-5 border"
              style={{
                backgroundColor: colors.surfaceDim,
                color: colors.onSurface,
                borderColor: colors.border,
                textAlignVertical: 'top',
              }}
              autoFocus
            />

            <Pressable
              onPress={handleSubmit}
              disabled={
                isSubmitting || !questionText.trim() || isResolvingSenior || !resolvedSeniorUserId
              }
              className="py-4 rounded-2xl items-center shadow-lg"
              style={{
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                opacity:
                  isSubmitting ||
                  !questionText.trim() ||
                  isResolvingSenior ||
                  !resolvedSeniorUserId
                    ? 0.6
                    : 1,
              }}>
              <AppText className="text-lg font-bold" style={{ color: colors.onPrimary }}>
                {isSubmitting
                  ? 'Sending...'
                  : isResolvingSenior
                    ? 'Resolving target...'
                    : 'Send to Family'}
              </AppText>
            </Pressable>
            {!resolvedSeniorUserId && (
              <AppText
                variant="small"
                className="mt-3 text-center"
                style={{ color: colors.textMuted }}>
                Select a senior before sending this question.
              </AppText>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SpringFab({
  onPress,
  color,
  label,
}: {
  onPress: () => void;
  color: string;
  label: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.9, { damping: 10, stiffness: 300 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}
      className="absolute bottom-[30px] right-5">
      <Animated.View
        className="py-3 px-5 rounded-[30px] flex-row items-center gap-2 shadow-lg"
        style={[{ backgroundColor: color, shadowColor: color }, animatedStyle]}>
        <Ionicons name="pencil" size={20} color="#FFF" />
        <AppText className="font-bold text-base text-white">{label}</AppText>
      </Animated.View>
    </Pressable>
  );
}


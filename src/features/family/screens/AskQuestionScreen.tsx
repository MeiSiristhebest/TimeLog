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
        style={[
          styles.tab,
          {
            backgroundColor: isSelected ? colors.primary : 'transparent',
            borderColor: isSelected ? colors.primary : colors.border,
          },
          animatedStyle,
        ]}>
        <AppText
          style={{
            color: isSelected ? colors.onPrimary : colors.onSurface,
            fontWeight: '500',
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
        style={[
          styles.questionCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: colors.primary,
          },
          animatedStyle,
        ]}>
        <AppText style={[styles.questionText, { color: colors.onSurface }]}>{item}</AppText>
        <View style={styles.useButton}>
          <AppText style={{ color: colors.primary, fontWeight: '600' }}>Use this ›</AppText>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function AskQuestionScreen(): JSX.Element {
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
    <View style={[styles.container, { backgroundColor: colors.surfaceDim }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} hitSlop={20}>
            <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
          </Pressable>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            Ask a Question
          </AppText>
          <View style={{ width: 24 }} />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {/* Category Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScroll}>
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
            style={[
              styles.seniorPickerContainer,
              { backgroundColor: colors.surface, borderBottomColor: colors.border },
            ]}>
            <AppText style={[styles.seniorPickerLabel, { color: colors.onSurface }]}>
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
                    style={[
                      styles.seniorChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceDim,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}>
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
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
          ListHeaderComponent={
            <AppText style={[styles.categoryTitle, { color: colors.onSurface }]}>
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
      />

      {/* Edit/Send Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                paddingBottom: insets.bottom + 24,
              },
            ]}>
            <View style={styles.modalHeader}>
              <AppText style={[styles.modalTitle, { color: colors.onSurface }]}>
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
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceDim,
                  color: colors.onSurface,
                  borderColor: colors.border,
                },
              ]}
              autoFocus
            />

            <Pressable
              onPress={handleSubmit}
              disabled={
                isSubmitting || !questionText.trim() || isResolvingSenior || !resolvedSeniorUserId
              }
              style={[
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                  opacity:
                    isSubmitting ||
                    !questionText.trim() ||
                    isResolvingSenior ||
                    !resolvedSeniorUserId
                      ? 0.6
                      : 1,
                },
              ]}>
              <AppText style={[styles.submitText, { color: colors.onPrimary }]}>
                {isSubmitting
                  ? 'Sending...'
                  : isResolvingSenior
                    ? 'Resolving target...'
                    : 'Send to Family'}
              </AppText>
            </Pressable>
            {!resolvedSeniorUserId && (
              <AppText
                style={{
                  marginTop: 12,
                  textAlign: 'center',
                  color: colors.textMuted,
                }}>
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
      onPressOut={() => (scale.value = withSpring(1, { damping: 10, stiffness: 300 }))}>
      <Animated.View
        style={[styles.fab, { backgroundColor: color, shadowColor: color }, animatedStyle]}>
        <Ionicons name="pencil" size={20} color="#FFF" />
        <AppText style={[styles.fabText, { color: '#FFF' }]}>{label}</AppText>
      </Animated.View>
    </Pressable>
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
  seniorPickerContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  seniorPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  seniorChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
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

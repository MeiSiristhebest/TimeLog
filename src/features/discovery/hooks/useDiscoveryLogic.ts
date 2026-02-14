import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { fetchDiscoveryQuestions, type DiscoveryQuestion } from '../services/discoveryService';
import { CATEGORY_META } from '../data/mockDiscoveryData';
import { useHeritageTheme } from '@/theme/heritage';
import { devLog } from '@/lib/devLogger';
import type { QuestionCategory } from '@/db/schema/familyQuestions';
import { QUESTION_CATEGORIES } from '@/db/schema/familyQuestions';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useDiscoveryLogic() {
  const router = useRouter();
  const theme = useHeritageTheme();
  const sessionUserId = useAuthStore((state) => state.sessionUserId);

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [deck, setDeck] = useState<DiscoveryQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // F3.2: Category filter state
  const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);

  // Load questions from Supabase on mount and when categories change
  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true);
      try {
        // F3.2: Server-side category filtering (optimized)
        const questions = await fetchDiscoveryQuestions(
          100,
          selectedCategories.length > 0 ? selectedCategories : undefined,
          sessionUserId ?? undefined
        );

        if (questions.length > 0) {
          setDeck(questions);
          setCurrentIndex(0); // Reset to first card when filter changes
        } else {
          // Fallback: if no questions match filter
          devLog.warn('[useDiscoveryLogic] No discovery questions found for selected categories');
          setDeck([]);
        }
      } catch (error) {
        devLog.error('[useDiscoveryLogic] Failed to load questions:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuestions();
  }, [selectedCategories, sessionUserId]); // Re-load when categories or user changes

  const currentCard = deck[currentIndex];

  // Animation values
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }, { translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  // Handlers
  const handleSelectTopic = () => {
    if (!currentCard) return;
    router.push({
      pathname: '/', // Home tab
      params: {
        topicId: currentCard.id,
        topicText: currentCard.text,
        topicCategory: currentCard.category,
        topicFamily: currentCard.tags?.includes('family') ? '1' : '0',
      },
    });
  };

  const handleNextCard = () => {
    if (isFlipping || deck.length === 0) return;
    setIsFlipping(true);

    // Animate out
    cardTranslateY.value = withTiming(-20, { duration: theme.animationDurations.CARD_FLIP_OUT });
    cardOpacity.value = withTiming(0, { duration: theme.animationDurations.CARD_FLIP_OUT }, () => {
      runOnJS(setCurrentIndex)((currentIndex + 1) % deck.length);
      // Reset position instantly
      cardTranslateY.value = 20;

      // Animate in - Flowing 500ms
      cardTranslateY.value = withSpring(0, theme.animation.modal); // Use heavy/smooth spring instead of default?
      cardOpacity.value = withTiming(
        1,
        { duration: theme.animationDurations.CARD_FLIP_IN },
        () => {
          runOnJS(setIsFlipping)(false);
        }
      );
    });
  };

  const goBack = () => router.back();

  // Helper to get category icon properties mapped to Theme
  const meta = useMemo(() => {
    if (!currentCard) return { icon: 'help-circle', color: theme.colors.primary };

    const catMeta = CATEGORY_META[currentCard.category || 'default'] || CATEGORY_META.default;

    // Color mapping - prefer object lookup over nested ternaries
    const COLOR_MAP: Record<string, string> = {
      sageGreen: theme.colors.sageGreen,
      amberCustom: theme.colors.amberCustom,
      textMuted: theme.colors.textMuted,
      primary: theme.colors.primary,
      primaryMuted: theme.colors.primaryMuted,
      tertiary: theme.colors.tertiary,
    };

    const color = COLOR_MAP[catMeta.colorKey] ?? theme.colors.primary;

    return { icon: catMeta.icon, color };
  }, [currentCard, theme.colors]);

  return {
    state: {
      currentCard,
      animatedCardStyle,
      meta,
      isLoading,
      deckSize: deck.length,
      selectedCategories, // F3.2: Expose for CategoryFilter
    },
    actions: {
      handleSelectTopic,
      handleNextCard,
      goBack,
      // F3.2: Category filter toggle
      handleCategoryToggle: (category: QuestionCategory) => {
        setSelectedCategories((prev) => {
          // If "All Topics" (GENERAL) is clicked, clear all filters
          if (category === QUESTION_CATEGORIES.GENERAL) {
            return [];
          }

          // Toggle the category
          if (prev.includes(category)) {
            return prev.filter((c) => c !== category);
          } else {
            return [...prev, category];
          }
        });
      },
    },
  };
}

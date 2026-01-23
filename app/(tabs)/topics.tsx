
import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { TOPIC_QUESTIONS } from '@/features/recorder/data/topicQuestions';
import { useHeritageTheme } from '@/theme/heritage';
import type { TopicQuestion } from '@/types/entities';

const { width } = Dimensions.get('window');

// Mock data for "Asked by Michael" badge
const MOCK_FAMILY_REQUEST = {
  isRequest: true,
  author: 'Michael',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeKyv6Is68ryyVsZbU7W1LaYedGd3lkGjzpcmO2C9vr2eyWBUi8vQT3ff2wsdexhTlTsuaoo41bYimeMPUcfHahNiSF3xw8fszJBd9YF_pOG_41lCz2Q0ZHDPlKAc8IrprSW6wxIuBM90UtU8xudu007XmYqmxf9tqDThAAjVCSFmo7asMbn0ojKj-iqG0WuFRjMk15jzyq1hEqDk8BL0cby6ODmpShcPRg8g_qTLUrBWTMZY7X6pMH6CywKW-cN7V7s7vJfborGpn'
};

// Paper texture asset
const PAPER_TEXTURE = require('../../assets/images/paper-texture.png');

export default function TopicsDiscoveryScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useHeritageTheme();

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  // Filter to curated list or use all
  const deck = useMemo(() => TOPIC_QUESTIONS.slice(0, 50), []);
  const currentCard = deck[currentIndex];

  // Animation values
  const cardScale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  const cardTranslateY = useSharedValue(0);

  // Handlers
  const handleSelectTopic = () => {
    router.push({
      pathname: '/',
      params: { topicId: currentCard.id },
    });
  };

  const handleNextCard = () => {
    if (isFlipping) return;
    setIsFlipping(true);

    // Animate out
    cardTranslateY.value = withTiming(-20, { duration: 150 });
    cardOpacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(setCurrentIndex)((currentIndex + 1) % deck.length);
      // Reset position instantly
      cardTranslateY.value = 20;

      // Animate in
      cardTranslateY.value = withSpring(0);
      cardOpacity.value = withTiming(1, { duration: 300 }, () => {
        runOnJS(setIsFlipping)(false);
      });
    });
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value }
    ],
    opacity: cardOpacity.value,
  }));

  // Helper to get category icon properties
  const getCategoryMeta = (catId?: string) => {
    switch (catId) {
      case 'childhood': return { icon: 'bicycle', color: '#6B8E6B' };
      case 'family': return { icon: 'heart', color: '#C49832' };
      case 'career': return { icon: 'briefcase', color: '#8B4332' };
      case 'wisdom': return { icon: 'bulb', color: '#475569' };
      case 'memories': return { icon: 'star', color: '#D4846A' };
      default: return { icon: 'chatbubbles', color: '#B85A3B' };
    }
  };

  const meta = getCategoryMeta(currentCard.category);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceDim }]} edges={['top']}>

      {/* 1. Header (Simple) */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: pressed ? 'rgba(0,0,0,0.05)' : 'transparent' }
          ]}
        >
          <Ionicons name="arrow-back" size={28} color={colors.textMuted} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Topic Discovery</Text>
        <Pressable style={styles.iconButton}>
          <Ionicons name="settings-outline" size={28} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* 2. Main Card Deck */}
      <View style={styles.deckContainer}>
        <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
          {/* Paper Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {/* Texture Overlay */}
            <Image source={PAPER_TEXTURE} style={styles.texture} resizeMode="repeat" />

            {/* Top: Icon */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${meta.color}15` }]}>
                <Ionicons name={meta.icon as any} size={40} color={meta.color} />
              </View>
            </View>

            {/* Middle: Content */}
            <View style={styles.cardContent}>
              {/* Gold Badge (Hardcoded for demo match HTML) */}
              <View style={styles.goldBadge}>
                <Image
                  source={{ uri: MOCK_FAMILY_REQUEST.avatar }}
                  style={styles.avatar}
                />
                <Text style={styles.goldText}>ASKED BY MICHAEL</Text>
              </View>

              {/* Question */}
              <Text style={[styles.questionText, { color: colors.onSurface }]}>
                {currentCard.text}
              </Text>

              {/* Helper Text (Mocked based on category for now) */}
              <Text style={styles.helperText}>
                Share your thoughts with the grandkids. Did you enjoy it?
              </Text>
            </View>

            {/* Bottom Decor */}
            <View style={[styles.cardFooter, { backgroundColor: colors.border }]} />
          </View>
        </Animated.View>
      </View>

      {/* 3. Actions */}
      <View style={[styles.actionsContainer, { backgroundColor: colors.surfaceDim }]}>
        {/* Primary Record Button */}
        <Pressable
          onPress={handleSelectTopic}
          style={({ pressed }) => [
            styles.recordButton,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              shadowColor: colors.primary,
            }
          ]}
        >
          <Ionicons name="mic" size={32} color="#FFF" style={{ marginRight: 12 }} />
          <Text style={styles.recordButtonText}>Record Answer</Text>
        </Pressable>

        {/* Secondary Try Another */}
        <Pressable
          onPress={handleNextCard}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: pressed ? 'rgba(255,255,255,0.5)' : 'transparent',
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textMuted }]}>
            Try Another Question
          </Text>
        </Pressable>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Fraunces_700Bold',
  },
  iconButton: {
    padding: 8,
    borderRadius: 999,
  },
  deckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden', // Contain texture
  },
  texture: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  cardHeader: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 24,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: 'rgba(180, 142, 45, 0.2)',
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 16,
    paddingVertical: 4,
    shadowColor: '#FFC832',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  goldText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A6A1C',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 32,
    fontFamily: 'Fraunces_700Bold', // Using Serif per request
    textAlign: 'center',
    lineHeight: 40,
  },
  helperText: {
    fontSize: 18,
    color: '#8C7B75',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 280,
  },
  cardFooter: {
    width: 48,
    height: 6,
    borderRadius: 3,
    opacity: 0.5,
    marginTop: 16,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  recordButton: {
    height: 72,
    borderRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  recordButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

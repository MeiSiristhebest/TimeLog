import { AppText } from '@/components/ui/AppText';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
import Animated from 'react-native-reanimated';

import { useHeritageTheme } from '@/theme/heritage';
import { useDiscoveryLogic } from '@/features/discovery/hooks/useDiscoveryLogic';
import {
  DISCOVERY_STRINGS,
  MOCK_FAMILY_REQUEST,
} from '@/features/discovery/data/mockDiscoveryData';

// Paper texture asset - could typically be moved to a shared asset constant but acceptable here or via theme
const PAPER_TEXTURE = require('../../assets/images/paper-texture.png');

export default function TopicsDiscoveryScreen(): JSX.Element {
  const { colors } = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useDiscoveryLogic();
  const { currentCard, animatedCardStyle, meta } = state;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surfaceDim }]}
      edges={['top']}>
      {/* 1. Header (Simple) */}
      <View style={styles.header}>
        <Pressable
          onPress={actions.goBack}
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: pressed ? 'rgba(0,0,0,0.05)' : 'transparent' },
          ]}>
          <Ionicons name="arrow-back" size={28} color={colors.textMuted} />
        </Pressable>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {DISCOVERY_STRINGS.header.title}
        </AppText>
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
            <Image source={PAPER_TEXTURE} style={styles.texture} contentFit="cover" />

            {/* Top: Icon */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${meta.color}15` }]}>
                <Ionicons name={meta.icon} size={40} color={meta.color} />
              </View>
            </View>

            {/* Middle: Content */}
            <View style={styles.cardContent}>
              {/* Gold Badge */}
              <View style={styles.goldBadge}>
                <Image
                  source={{ uri: MOCK_FAMILY_REQUEST.avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <AppText style={styles.goldText}>{DISCOVERY_STRINGS.card.badge}</AppText>
              </View>

              {/* Question */}
              <AppText style={[styles.questionText, { color: colors.onSurface }]}>
                {currentCard.text}
              </AppText>

              {/* Helper Text */}
              <AppText style={styles.helperText}>{DISCOVERY_STRINGS.card.helperText}</AppText>
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
          onPress={actions.handleSelectTopic}
          style={({ pressed }) => [
            styles.recordButton,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              shadowColor: colors.primary,
            },
          ]}>
          <Ionicons name="mic" size={32} color="#FFF" style={{ marginRight: 12 }} />
          <AppText style={styles.recordButtonText}>
            {DISCOVERY_STRINGS.actions.recordAnswer}
          </AppText>
        </Pressable>

        {/* Secondary Try Another */}
        <Pressable
          onPress={actions.handleNextCard}
          style={({ pressed }) => [
            styles.secondaryButton,
            {
              backgroundColor: pressed ? 'rgba(255,255,255,0.5)' : 'transparent',
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}>
          <AppText style={[styles.secondaryButtonText, { color: colors.textMuted }]}>
            {DISCOVERY_STRINGS.actions.tryAnother}
          </AppText>
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

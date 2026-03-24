import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@/components/ui/Icon';
import { Animated } from '@/tw/animated';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useHeritageTheme } from '@/theme/heritage';
import { useDiscoveryLogic } from '@/features/discovery/hooks/useDiscoveryLogic';
import { CategoryFilter } from '@/features/discovery/components/CategoryFilter';
import { AppText } from '@/components/ui/AppText';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { useIsTopicAnswered } from '@/features/recorder/hooks/useAnsweredTopics';
import {
  DISCOVERY_STRINGS,
  MOCK_FAMILY_REQUEST,
} from '@/features/discovery/data/mockDiscoveryData';

// Paper texture asset - could typically be moved to a shared asset constant but acceptable here or via theme
const PAPER_TEXTURE = require('../../../../assets/images/paper-texture.png');

export default function TopicsDiscoveryScreen(): JSX.Element {
  const { colors } = useHeritageTheme();
  const pressedOverlayColor = `${colors.onSurface}0D`;
  const goldBadgeBackground = `${colors.warning}14`;
  const goldBadgeBorder = `${colors.warning}33`;
  const goldBadgeShadow = `${colors.warning}66`;
  const goldBadgeText = colors.warning;
  const helperTextColor = colors.textMuted;
  const answeredBadgeBackground = `${colors.success}1F`;

  // Logic Separation
  const { state, actions } = useDiscoveryLogic();
  const { currentCard, animatedCardStyle, meta, selectedCategories } = state;
  const isTopicAnswered = useIsTopicAnswered(currentCard?.id);
  const isFamilyTopic =
    !!currentCard &&
    (currentCard.category === 'family_history' ||
      currentCard.category === 'family' ||
      currentCard.tags?.includes('family'));

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
            { backgroundColor: pressed ? pressedOverlayColor : 'transparent' },
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

      {/* 1.5 Category Filter */}
      <CategoryFilter
        selectedCategories={selectedCategories}
        onCategoryToggle={actions.handleCategoryToggle}
      />

      {/* 2. Main Card Deck */}
      <View style={styles.deckContainer}>
        <Animated.View
          style={[styles.cardWrapper, { shadowColor: colors.shadowNeutral }, animatedCardStyle]}>
          {/* Paper Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: `${colors.onSurface}0D`,
              },
            ]}>
            {/* Texture Overlay */}
            <Image source={PAPER_TEXTURE} style={styles.texture} contentFit="cover" />

            {/* Top: Icon */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconCircle, { backgroundColor: `${meta.color}15` }]}>
                <Ionicons
                  name={meta.icon as keyof typeof Ionicons.glyphMap}
                  size={28}
                  color={meta.color}
                />
              </View>
            </View>

            {/* Middle: Content */}
            <ScrollView
              style={{ flex: 1, width: '100%' }}
              contentContainerStyle={styles.cardContent}
              showsVerticalScrollIndicator={false}>
              {/* Gold Badge */}
              {isFamilyTopic ? (
                <View
                  style={[
                    styles.goldBadge,
                    {
                      backgroundColor: goldBadgeBackground,
                      borderColor: goldBadgeBorder,
                      shadowColor: goldBadgeShadow,
                    },
                  ]}>
                  {MOCK_FAMILY_REQUEST.avatar ? (
                    <Image
                      source={{ uri: MOCK_FAMILY_REQUEST.avatar }}
                      style={[styles.avatar, { borderColor: colors.surface }]}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        { borderColor: colors.surface, backgroundColor: `${colors.warning}24` },
                      ]}>
                      <Ionicons name="people" size={16} color={goldBadgeText} />
                    </View>
                  )}
                  <AppText style={[styles.goldText, { color: goldBadgeText }]}>
                    {DISCOVERY_STRINGS.card.badge}
                  </AppText>
                </View>
              ) : null}

              {/* Question */}
              <AppText style={[styles.questionText, { color: colors.onSurface }]}>
                {currentCard?.text ?? 'No topics found for selected categories'}
              </AppText>

              {/* Helper Text */}
              <AppText style={[styles.helperText, { color: helperTextColor }]}>
                {DISCOVERY_STRINGS.card.helperText}
              </AppText>

              {isTopicAnswered ? (
                <View style={[styles.answeredBadge, { backgroundColor: answeredBadgeBackground }]}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <AppText style={[styles.answeredText, { color: colors.success }]}>
                    Answered
                  </AppText>
                </View>
              ) : null}
            </ScrollView>

            {/* Bottom Decor */}
            <View style={[styles.cardFooter, { backgroundColor: colors.border }]} />
          </View>
        </Animated.View>
      </View>

      {/* 3. Actions */}
      <View style={[styles.actionsContainer, { backgroundColor: colors.surfaceDim }]}>
        {/* Primary Record Button */}
        <DiscoveryButton
          onPress={actions.handleSelectTopic}
          variant="primary"
          icon="mic"
          label={DISCOVERY_STRINGS.actions.recordAnswer}
          disabled={!currentCard}
        />

        {/* Secondary Try Another */}
        <DiscoveryButton
          onPress={actions.handleNextCard}
          variant="secondary"
          label={DISCOVERY_STRINGS.actions.tryAnother}
          disabled={!currentCard}
        />
      </View>
    </SafeAreaView>
  );
}

// Interactive Button Component with Spring Physics
function DiscoveryButton({
  onPress,
  variant,
  label,
  icon,
  disabled = false,
}: {
  onPress: () => void;
  variant: 'primary' | 'secondary';
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  const { colors } = useHeritageTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(variant === 'primary' ? 0.96 : 0.98, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  // Styles based on variant
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}>
      <Animated.View
        style={[
          isPrimary ? styles.recordButton : styles.secondaryButton,
          isPrimary
            ? { backgroundColor: colors.primary, shadowColor: colors.primary }
            : { borderColor: 'transparent' },
          disabled ? { opacity: 0.5 } : null,
          animatedStyle,
        ]}>
        {icon && <Ionicons name={icon} size={26} color={colors.onPrimary} style={{ marginRight: 8 }} />}
        <AppText
          style={
            isPrimary
              ? [styles.recordButtonText, { color: colors.onPrimary }]
              : [styles.secondaryButtonText, { color: colors.textMuted }]
          }>
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
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
    flex: 1, // Let it expand instead of forcing aspect ratio
    maxHeight: 500, // Still constrain the maximum height for tablets
    maxWidth: 400,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'transparent',
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
    marginTop: -8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    width: '100%',
    gap: 24,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 16,
    paddingVertical: 4,
    shadowColor: 'transparent',
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
    borderColor: 'transparent',
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  goldText: {
    fontSize: 13,
    fontWeight: '700',
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
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 280,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  answeredText: {
    fontSize: 13,
    fontWeight: '700',
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
    paddingBottom: 16,
    gap: 12,
  },
  recordButton: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  recordButtonText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

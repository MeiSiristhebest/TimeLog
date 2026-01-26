import { AppText } from '@/components/ui/AppText';
import { View, StyleSheet } from 'react-native';

import { Image } from 'expo-image';
import { Ionicons } from '@/components/ui/Icon';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import type { TopicQuestion } from '@/types/entities';

// Category to icon mapping
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  childhood: 'bicycle-outline',
  family: 'heart-outline',
  career: 'briefcase-outline',
  milestones: 'star-outline',
  reflections: 'bulb-outline',
  adventures: 'airplane-outline',
  default: 'chatbubble-outline',
};

export type QuestionCardProps = {
  /** The question to display */
  question: TopicQuestion;
  /** F3.5: Whether this topic has been answered */
  isAnswered?: boolean;
  /** Whether TTS is currently speaking (recorder variant) */
  isSpeaking?: boolean;
  /** Callback when Replay button is pressed (recorder variant) */
  onReplay?: () => void;
  /** Callback when New Topic button is pressed (recorder variant) */
  onNewTopic?: () => void;
  /** Callback when Next button is pressed (discovery variant) */
  onNext?: () => void;
  /** Callback when Record This button is pressed (discovery variant) */
  onRecordThis?: () => void;
  /** Whether buttons should be disabled (e.g., during recording) */
  disabled?: boolean;
  /** Display variant: 'recorder' (default) or 'discovery' */
  variant?: 'recorder' | 'discovery';
};

/**
 * QuestionCard displays a topic question with controls.
 *
 * Elderly-Friendly Design (UX Spec + Apple HIG):
 * - Large question text for excellent readability
 * - High contrast colors (7:1 ratio)
 * - Focus on clarity and simplicity
 * - Topic icon for visual context
 */
export function QuestionCard({
  question,
  isAnswered = false,
  isSpeaking = false,
  onReplay,
  onNewTopic,
  onNext,
  onRecordThis,
  disabled = false,
  variant = 'recorder',
}: QuestionCardProps): JSX.Element {
  const isDiscovery = variant === 'discovery';
  const theme = useHeritageTheme();
  const { colors } = theme;

  const categoryIcon = CATEGORY_ICONS[question.category || 'default'] || CATEGORY_ICONS.default;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}>
      {/* 1. Topic Icon */}
      {isDiscovery && (
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name={categoryIcon} size={40} color={colors.primary} />
          </View>
        </View>
      )}

      {/* 2. Family Request Badge (Gold Style) */}
      {question.isFromFamily && question.submittedBy && (
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.goldBadge,
              {
                backgroundColor: colors.surfaceCream,
                borderColor: colors.amberCustom,
              },
            ]}>
            {question.submitterAvatar && (
              <Image
                source={{ uri: question.submitterAvatar }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            )}
            <AppText style={[styles.goldBadgeText, { color: colors.amberDeep }]}>
              Asked by {question.submittedBy}
            </AppText>
          </View>
        </View>
      )}

      {/* 3. Question Text - Large and readable */}
      <View style={styles.questionRow}>
        <AppText
          style={[
            styles.questionText,
            { color: colors.onSurface },
            isDiscovery && styles.questionTextLarge,
          ]}
          accessibilityRole="text"
          accessibilityLabel={question.text}>
          {question.text}
        </AppText>
        {/* F3.5: Answered checkmark indicator */}
        {isAnswered && (
          <View style={[styles.answeredBadge, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          </View>
        )}
      </View>

      {/* 4. Motivation Hint (Discovery only) */}
      {isDiscovery && (
        <AppText style={[styles.hintText, { color: colors.textMuted }]}>
          Share your memories. Your family would love to hear this story.
        </AppText>
      )}

      {/* Card Footer Decor (Discovery only) */}
      {isDiscovery && <View style={[styles.decorLine, { backgroundColor: colors.border }]} />}

      {/* Button Row */}
      <View style={isDiscovery ? styles.discoveryButtons : styles.buttonRow}>
        {isDiscovery ? (
          <>
            {/* Primary: Record Answer (Full Width) */}
            <HeritageButton
              title="Record Answer"
              icon="mic"
              onPress={onRecordThis || (() => {})}
              disabled={disabled}
              variant="primary"
              fullWidth
              style={{ height: 72 }}
              textStyle={{ fontSize: 20, fontWeight: '700' }}
            />

            {/* Secondary: Try Another (Ghost) */}
            <HeritageButton
              title="Try Another Question"
              onPress={onNext || (() => {})}
              disabled={disabled}
              variant="ghost"
              fullWidth
              style={{ height: 56 }}
              textStyle={{ fontSize: 16 }}
            />
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <HeritageButton
                title={isSpeaking ? 'Playing...' : 'Replay'}
                icon={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                onPress={onReplay || (() => {})}
                disabled={disabled}
                variant="secondary"
              />
            </View>
            <View style={{ flex: 1 }}>
              <HeritageButton
                title="New Topic"
                icon="shuffle-outline"
                onPress={onNewTopic || (() => {})}
                disabled={disabled}
                variant="secondary"
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    padding: 32,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 12,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingRight: 16,
    paddingLeft: 4,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 8,
    shadowColor: 'rgba(255, 200, 50, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFCF7', // PALETTE.surface
  },
  goldBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 24,
    lineHeight: 36,
    fontWeight: '700',
    fontFamily: 'Fraunces_600SemiBold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  questionTextLarge: {
    fontSize: 34,
    lineHeight: 44,
    marginBottom: 24,
  },
  hintText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
    alignSelf: 'center',
  },
  decorLine: {
    width: 48,
    height: 6,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  discoveryButtons: {
    gap: 16,
  },
  // F3.5: Styles for answered indicator
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
  },
  answeredBadge: {
    borderRadius: 12,
    padding: 4,
    marginTop: 4,
  },
});

export default QuestionCard;

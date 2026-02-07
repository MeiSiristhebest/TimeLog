
import { Ionicons } from '@/components/ui/Icon';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import type { TopicQuestion } from '@/types/entities';
import { AppText } from '@/components/ui/AppText';
import { View } from 'react-native';
import { Image } from 'expo-image';

// Category to icon mapping
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  childhood: 'bicycle-outline',
  family: 'heart-outline',
  career: 'briefcase-outline',
  milestones: 'star-outline',

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
      className="mx-4 rounded-[32px] border p-8 shadow-sm elevation-12"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.1,
        shadowRadius: 32,
      }}>
      {/* 1. Topic Icon */}
      {isDiscovery && (
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full items-center justify-center" style={{ backgroundColor: `${colors.primary}15` }}>
            <Ionicons name={categoryIcon} size={40} color={colors.primary} />
          </View>
        </View>
      )}

      {/* 2. Family Request Badge (Gold Style) */}
      {question.isFromFamily && question.submittedBy && (
        <View className="items-center mb-6">
          <View
            className="flex-row items-center rounded-3xl pr-4 pl-1 py-1 border gap-2 shadow-sm elevation-4"
            style={{
              backgroundColor: colors.surfaceCream,
              borderColor: colors.amberCustom,
              shadowColor: 'rgba(255, 200, 50, 0.3)',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 1,
              shadowRadius: 12,
            }}>
            {question.submitterAvatar && (
              <Image
                source={{ uri: question.submitterAvatar }}
                className="w-8 h-8 rounded-full border border-[#FFFCF7]"
                contentFit="cover"
              />
            )}
            <AppText className="text-[13px] font-bold uppercase tracking-[0.5px]" style={{ color: colors.amberDeep }}>
              Asked by {question.submittedBy}
            </AppText>
          </View>
        </View>
      )}

      {/* 3. Question Text - Large and readable */}
      <View className="flex-row items-start justify-center gap-2">
        <AppText
          className={`font-serif font-semibold text-center mb-4 tracking-[0.3px] ${isDiscovery ? 'text-[34px] leading-[44px] mb-6' : 'text-2xl leading-9'}`}
          style={{ color: colors.onSurface }}
          accessibilityRole="text"
          accessibilityLabel={question.text}>
          {question.text}
        </AppText>
        {/* F3.5: Answered checkmark indicator */}
        {isAnswered && (
          <View className="mt-1 rounded-xl p-1" style={{ backgroundColor: `${colors.success}20` }}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          </View>
        )}
      </View>

      {/* 4. Motivation Hint (Discovery only) */}
      {isDiscovery && (
        <AppText className="text-lg leading-7 text-center mb-6 max-w-[280px] self-center" style={{ color: colors.textMuted }}>
          Share your memories. Your family would love to hear this story.
        </AppText>
      )}

      {/* Card Footer Decor (Discovery only) */}
      {isDiscovery && <View className="w-12 h-1.5 rounded-full self-center mb-8" style={{ backgroundColor: colors.border }} />}

      {/* Button Row */}
      <View className={isDiscovery ? "gap-4" : "flex-row gap-4"}>
        {isDiscovery ? (
          <>
            {/* Primary: Record Answer (Full Width) */}
            <HeritageButton
              title="Record Answer"
              icon="mic"
              onPress={onRecordThis || (() => { })}
              disabled={disabled}
              variant="primary"
              fullWidth
              style={{ height: 72 }}
              textStyle={{ fontSize: 20, fontWeight: '700' }}
            />

            {/* Secondary: Try Another (Ghost) */}
            <HeritageButton
              title="Next"
              onPress={onNext || (() => { })}
              disabled={disabled}
              variant="ghost"
              fullWidth
              style={{ height: 56 }}
              textStyle={{ fontSize: 16 }}
            />
          </>
        ) : (
          <>
            <View className="flex-1">
              <HeritageButton
                title={isSpeaking ? 'Playing' : 'Replay'}
                icon={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                onPress={onReplay || (() => { })}
                disabled={disabled}
                variant="secondary"
              />
            </View>
            <View className="flex-1">
              <HeritageButton
                title="Next"
                icon="arrow-forward-circle-outline" // Clearer directional icon
                onPress={onNewTopic || (() => { })}
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

export default QuestionCard;

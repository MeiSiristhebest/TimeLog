import { Ionicons } from '@/components/ui/Icon';
import { HeritageButton } from './HeritageButton';
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { View } from 'react-native';

type HeritageEmptyStateProps = {
  /** Icon name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** CTA button title */
  actionTitle?: string;
  /** CTA button press handler */
  onAction?: () => void;
  /** Secondary action title */
  secondaryActionTitle?: string;
  /** Secondary action handler */
  onSecondaryAction?: () => void;
  /** Compact mode (less padding) */
  compact?: boolean;
};

export function HeritageEmptyState({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  secondaryActionTitle,
  onSecondaryAction,
  compact = false,
}: HeritageEmptyStateProps) {
  const { colors } = useHeritageTheme();

  return (
    <View className={`${styles.container} ${compact ? styles.containerCompact : ''}`}>
      {/* Icon */}
      <View
        className={styles.iconContainer}
        style={{ backgroundColor: colors.surfaceCream }} // Using closest token for iconBg
      >
        <Ionicons name={icon} size={48} color={colors.primary} />
      </View>

      {/* Text */}
      <View className={styles.textContainer}>
        <AppText className={styles.title} style={{ color: colors.onSurface }}>{title}</AppText>
        {description && <AppText className={styles.description} style={{ color: colors.textMuted }}>{description}</AppText>}
      </View>

      {/* Actions */}
      {(actionTitle || secondaryActionTitle) && (
        <View className={styles.actions}>
          {actionTitle && onAction && (
            <HeritageButton
              title={actionTitle}
              onPress={onAction}
              variant="primary"
              size="medium"
            />
          )}
          {secondaryActionTitle && onSecondaryAction && (
            <HeritageButton
              title={secondaryActionTitle}
              onPress={onSecondaryAction}
              variant="ghost"
              size="small"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = {
  container: 'flex-1 items-center justify-center p-8',
  containerCompact: 'p-6',
  iconContainer: 'w-24 h-24 rounded-full items-center justify-center mb-6',
  textContainer: 'items-center mb-6',
  title: 'text-2xl font-bold text-center mb-2 font-serif font-semibold',
  description: 'text-base text-center leading-6 max-w-[300px]',
  actions: 'items-center gap-3',
} as const;

export default HeritageEmptyState;

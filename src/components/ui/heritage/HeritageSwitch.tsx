
import { useHeritageTheme } from '@/theme/heritage';
import { AppText } from '@/components/ui/AppText';
import { Switch, SwitchProps , View } from 'react-native';


export interface HeritageSwitchProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor'> {
  /** Optional label to display next to switch */
  label?: string;
  /** Custom track colors (overrides theme) */
  trackColor?: { false: string; true: string };
  /** Custom thumb color (overrides theme) */
  thumbColor?: string;
}

/**
 * HeritageSwitch - Themed Switch Component
 *
 * Provides consistent Switch styling across the app using Heritage theme colors.
 * Automatically applies theme colors for track and thumb.
 *
 * @example
 * ```tsx
 * <HeritageSwitch
 *   value={isEnabled}
 *   onValueChange={setIsEnabled}
 *   label="Enable Notifications"
 * />
 * ```
 */
export function HeritageSwitch({
  label,
  trackColor,
  thumbColor,
  value,
  ...props
}: HeritageSwitchProps): JSX.Element {
  const { colors } = useHeritageTheme();

  // Theme-based colors with override support
  const finalTrackColor = trackColor || {
    false: colors.disabled,
    true: colors.primary,
  };

  const finalThumbColor = thumbColor || colors.surface;

  if (label) {
    return (
      <View className={styles.container}>
        <AppText className={styles.label} style={{ color: colors.onSurface }}>{label}</AppText>
        <Switch
          value={value}
          trackColor={finalTrackColor}
          thumbColor={finalThumbColor}
          {...props}
        />
      </View>
    );
  }

  return (
    <Switch value={value} trackColor={finalTrackColor} thumbColor={finalThumbColor} {...props} />
  );
}

const styles = {
  container: 'flex-row items-center justify-between gap-3',
  label: 'text-base font-medium',
} as const;

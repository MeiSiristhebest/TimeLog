import { useHeritageTheme } from '@/theme/heritage';
import { StyleSheet, TextProps, TextStyle, Text } from 'react-native';

export type AppTextVariant = 
  | 'display' 
  | 'headline' 
  | 'title' 
  | 'body' 
  | 'body-lg' 
  | 'caption' 
  | 'small';

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  className?: string;
};

/**
 * Robust Typography Component for TimeLog.
 * - Minimalism + Heritage Parchment aesthetic.
 * - High Contrast by default (charcoal on cream).
 * - Optimized for Elderly Accessibility (48dp-ready scale).
 * - Automatic Fraunces (Serif) support for storytelling moments.
 */
export function AppText({
  variant = 'body',
  style,
  className,
  allowFontScaling = false,
  ...rest
}: AppTextProps): JSX.Element {
  const { colors, typography, isDark } = useHeritageTheme();
  
  // Scaling ratio from base (24px body)
  const scale = typography.body / 24;

  // Determine standard font sizes based on variant
  // These mapping corresponds to the tailwind.config.js variants
  const getBaseSize = (v: AppTextVariant) => {
    switch(v) {
      case 'display': return 36;
      case 'headline': return 28;
      case 'title': return 22;
      case 'body-lg': return 24;
      case 'body': return 20;
      case 'caption': return 16;
      case 'small': return 14;
      default: return 20;
    }
  };

  const getLineHeight = (v: AppTextVariant, size: number) => {
    switch(v) {
      case 'display': return 44;
      case 'headline': return 36;
      case 'title': return 28;
      case 'body-lg': return 32;
      case 'body': return 28;
      case 'caption': return 22;
      case 'small': return 18;
      default: return 28;
    }
  };

  const baseFontSize = getBaseSize(variant);
  const baseLineHeight = getLineHeight(variant, baseFontSize);

  const fontSize = Math.round(baseFontSize * scale);
  const lineHeight = Math.round(baseLineHeight * scale);

  // Auto-resolve Serif (Fraunces) vs Sans System Font
  const isSerif = /\bfont-serif\b/.test(className ?? '') || variant === 'display' || variant === 'headline';
  const fontFamily = isSerif ? 'Fraunces_600SemiBold' : 'System';

  // Final Style with high contrast defaults
  const textStyle: TextStyle = {
    fontFamily,
    fontSize,
    lineHeight,
    color: colors.onSurface, // charcoal on cream contrast
    textAlign: 'left',
  };

  return (
    <Text
      {...rest}
      allowFontScaling={allowFontScaling}
      className={className}
      style={[textStyle, style]}
    />
  );
}

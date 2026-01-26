import { StyleSheet, Text, TextProps } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';

type Variant = 'body' | 'title' | 'subtitle' | 'caption' | 'label';

type AppTextProps = TextProps & {
  variant?: Variant;
};

export function AppText({ variant = 'body', style, ...rest }: AppTextProps): JSX.Element {
  const { typography } = useHeritageTheme();
  const flattenedStyle = StyleSheet.flatten(style);
  const scale = typography.body / 24;
  const baseFontSize =
    typeof flattenedStyle?.fontSize === 'number' ? flattenedStyle.fontSize : undefined;
  const baseLineHeight =
    typeof flattenedStyle?.lineHeight === 'number' ? flattenedStyle.lineHeight : undefined;
  const fontSize = baseFontSize ? Math.round(baseFontSize * scale) : typography[variant];
  const lineHeight = baseLineHeight ? Math.round(baseLineHeight * scale) : undefined;

  return <Text {...rest} style={[style, { fontSize }, lineHeight ? { lineHeight } : null]} />;
}

import { useHeritageTheme } from '@/theme/heritage';
import { StyleSheet, TextProps, TextStyle } from 'react-native';
import { Text } from 'react-native';

type Variant = 'body' | 'title' | 'subtitle' | 'caption' | 'label';

type AppTextProps = TextProps & {
  variant?: Variant;
  className?: string;
};

function hasClassFontSize(className?: string): boolean {
  if (!className) return false;
  return /\btext-(?:\[[^\]]+\]|xs|sm|base|lg|xl|[2-9]xl)\b/.test(className);
}

function hasClassLineHeight(className?: string): boolean {
  if (!className) return false;
  return /\bleading-(?:\[[^\]]+\]|none|tight|snug|normal|relaxed|loose|\d+)\b/.test(className);
}

function getWeightFromClassName(className?: string): number | null {
  if (!className) return null;
  const matches = Array.from(
    className.matchAll(/\bfont-(light|normal|medium|semibold|bold|extrabold|black)\b/g)
  );
  const match = matches[matches.length - 1]?.[1];

  if (!match) return null;

  switch (match) {
    case 'light':
      return 300;
    case 'normal':
      return 400;
    case 'medium':
      return 500;
    case 'semibold':
      return 600;
    case 'bold':
      return 700;
    case 'extrabold':
      return 800;
    case 'black':
      return 900;
    default:
      return null;
  }
}

function normalizeWeight(fontWeight: TextStyle['fontWeight']): number | null {
  if (typeof fontWeight === 'number') {
    return Number.isFinite(fontWeight) ? fontWeight : null;
  }
  if (typeof fontWeight !== 'string') {
    return null;
  }

  if (/^\d+$/.test(fontWeight)) {
    return Number(fontWeight);
  }

  switch (fontWeight) {
    case 'normal':
      return 400;
    case 'bold':
      return 700;
    default:
      return null;
  }
}

function frauncesFamilyByWeight(weight: number): string {
  if (weight <= 350) return 'Fraunces_300Light';
  if (weight <= 550) return 'Fraunces_400Regular';
  if (weight <= 650) return 'Fraunces_600SemiBold';
  return 'Fraunces_700Bold';
}

function resolveFrauncesOverride(
  className: string | undefined,
  flattenedStyle: TextStyle | undefined
): TextStyle | undefined {
  const usesSerifClass = /\bfont-serif\b/.test(className ?? '');
  const usesDisplayClass = /\bfont-display\b/.test(className ?? '');
  const styleFontFamily =
    typeof flattenedStyle?.fontFamily === 'string' ? flattenedStyle.fontFamily : undefined;
  const usesFrauncesStyleFamily = styleFontFamily?.startsWith('Fraunces_') ?? false;

  if (!usesSerifClass && !usesDisplayClass && !usesFrauncesStyleFamily) {
    return undefined;
  }

  const classWeight = getWeightFromClassName(className);
  const styleWeight = normalizeWeight(flattenedStyle?.fontWeight);
  const resolvedWeight = classWeight ?? styleWeight;

  let fallbackFamily = styleFontFamily;
  if (!fallbackFamily) {
    fallbackFamily = usesDisplayClass ? 'Fraunces_400Regular' : 'Fraunces_600SemiBold';
  }

  return {
    fontFamily: resolvedWeight ? frauncesFamilyByWeight(resolvedWeight) : fallbackFamily,
    // Android may fallback to system fonts when custom fontFamily and fontWeight coexist.
    fontWeight: 'normal',
  };
}

export function AppText({
  variant = 'body',
  style,
  className,
  allowFontScaling = false,
  ...rest
}: AppTextProps): JSX.Element {
  const { typography } = useHeritageTheme();
  const flattenedStyle = StyleSheet.flatten(style) as TextStyle | undefined;
  const scale = typography.body / 24;
  const usesClassFontSize = hasClassFontSize(className);
  const usesClassLineHeight = hasClassLineHeight(className);
  const frauncesOverride = resolveFrauncesOverride(className, flattenedStyle);
  const baseFontSize =
    typeof flattenedStyle?.fontSize === 'number' ? flattenedStyle.fontSize : undefined;
  const baseLineHeight =
    typeof flattenedStyle?.lineHeight === 'number' ? flattenedStyle.lineHeight : undefined;
  const fontSize =
    baseFontSize || usesClassFontSize
      ? baseFontSize
        ? Math.round(baseFontSize * scale)
        : undefined
      : typography[variant];
  const lineHeight =
    baseLineHeight || usesClassLineHeight
      ? baseLineHeight
        ? Math.round(baseLineHeight * scale)
        : undefined
      : undefined;

  return (
    <Text
      {...rest}
      allowFontScaling={allowFontScaling}
      className={className}
      style={[
        style,
        fontSize !== undefined ? { fontSize } : null,
        lineHeight ? { lineHeight } : null,
        frauncesOverride,
      ]}
    />
  );
}

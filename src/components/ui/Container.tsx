import { View, ScrollView, ViewStyle, StyleProp } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  contentContainerClassName?: string;
  safe?: boolean;
  scrollable?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/**
 * Standardized Root Screen Wrapper for TimeLog.
 * - Minimalism + Heritage Parchment aesthetic.
 * - Handles Safe Areas (optional).
 * - Handles Scrolling (optional).
 * - Enforces standard screen gutters (px-4 by default).
 */
export function Container({
  children,
  style,
  className,
  contentContainerClassName,
  safe = false,
  scrollable = true,
  edges = ['top', 'bottom'],
}: ContainerProps): JSX.Element {
  const { colors } = useHeritageTheme();

  const Wrapper = safe ? SafeAreaView : View;
  const ContentWrapper = scrollable ? ScrollView : View;

  const baseStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.surface,
  };

  return (
    <Wrapper style={baseStyle} edges={safe ? edges : undefined} className="flex-1">
      <ContentWrapper
        className={className}
        style={[style, !scrollable && { flex: 1 }]}
        contentContainerClassName={contentContainerClassName}
        contentContainerStyle={scrollable ? { flexGrow: 1 } : undefined}
        contentInsetAdjustmentBehavior={scrollable ? 'automatic' : undefined}
        showsVerticalScrollIndicator={false}>
        {children}
      </ContentWrapper>
    </Wrapper>
  );
}

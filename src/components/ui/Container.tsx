import { ViewStyle, StyleProp , ScrollView } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';


/**
 * Root container with Apple-style defaults:
 * - Safe area insets via contentInsetAdjustmentBehavior
 * - Warm background color
 * - Consistent padding
 */
export function Container({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <ScrollView
      className="flex-1"
      style={[{ backgroundColor: colors.surface }, style]}
      contentContainerStyle={{ flexGrow: 1 }}
      contentInsetAdjustmentBehavior="automatic">
      {children}
    </ScrollView>
  );
}

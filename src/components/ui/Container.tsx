import { ViewStyle, StyleProp } from 'react-native';
import { ScrollView } from 'react-native';

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
  return (
    <ScrollView
      className="bg-surface flex-1"
      style={style}
      contentContainerStyle={{ flexGrow: 1 }}
      contentInsetAdjustmentBehavior="automatic">
      {children}
    </ScrollView>
  );
}

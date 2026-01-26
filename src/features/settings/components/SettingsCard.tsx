import { View, StyleSheet, Platform } from 'react-native';
import { useHeritageTheme } from '@/theme/heritage';

type SettingsCardProps = {
  children: React.ReactNode;
};

export function SettingsCard({ children }: SettingsCardProps): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceCard,
          borderColor: colors.border,
          ...Platform.select({
            ios: {
              shadowColor: colors.shadowNeutral,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
            },
            android: {
              elevation: 2,
            },
          }),
        },
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20, // Apple-style large radius
    borderWidth: 1,
    overflow: 'hidden',
  },
});

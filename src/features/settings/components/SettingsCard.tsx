import { useHeritageTheme } from '@/theme/heritage';
import { Platform , View } from 'react-native';


type SettingsCardProps = {
  children: React.ReactNode;
};

export function SettingsCard({ children }: SettingsCardProps): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <View
      className="rounded-[20px] border overflow-hidden"
      style={{
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
      }}>
      {children}
    </View>
  );
}

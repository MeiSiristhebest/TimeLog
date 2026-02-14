import { Stack } from 'expo-router';
import { useHeritageTheme } from '@/theme/heritage';

/**
 * Family Stack Layout
 * This prevents nested family screens from appearing as tabs
 */
export default function FamilyLayout(): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.surfaceDim,
        },
        headerStyle: {
          backgroundColor: colors.surfaceDim,
        },
        headerTitleStyle: {
          color: colors.onSurface,
          fontSize: 20,
          fontWeight: '700',
        },
        headerTintColor: colors.onSurface,
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Family',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="ask-question"
        options={{
          headerShown: false, // This screen has its own custom header
        }}
      />
    </Stack>
  );
}

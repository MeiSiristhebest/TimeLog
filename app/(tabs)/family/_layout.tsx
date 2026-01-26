import { Stack } from 'expo-router';

/**
 * Family Stack Layout
 * This prevents nested family screens from appearing as tabs
 */
export default function FamilyLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        // Heritage theme colors: surfaceDim=#F9F3E8 → #FFFAF5 for warm cream
        headerStyle: {
          backgroundColor: '#FFFAF5', // theme.colors.surfaceDim variant
        },
        headerTitleStyle: {
          color: '#2C2C2C', // theme.colors.onSurface
          fontSize: 20,
          fontWeight: '700',
        },
        headerTintColor: '#2C2C2C', // theme.colors.onSurface
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

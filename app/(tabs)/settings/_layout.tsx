import { Stack } from 'expo-router';
import { useHeritageTheme } from '@/theme/heritage';

/**
 * Settings Stack Layout
 * This prevents nested settings screens from appearing as tabs
 */
export default function SettingsLayout(): JSX.Element {
  const { colors } = useHeritageTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Most screens handle their own header
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
          headerShown: false, // Settings has custom header in the component
        }}
      />
      <Stack.Screen
        name="app-settings"
        options={{
          headerShown: false,
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="account-security"
        options={{
          headerShown: false,
          title: 'Account & Security',
        }}
      />
      <Stack.Screen
        name="family-sharing"
        options={{
          headerShown: false,
          title: 'Family Sharing',
        }}
      />
      <Stack.Screen
        name="display-accessibility"
        options={{
          headerShown: false,
          title: 'Display & Brightness', // WeChat name often, or Interface
        }}
      />
      <Stack.Screen
        name="font-size"
        options={{
          headerShown: false,
          title: 'Font Size',
        }}
      />
      <Stack.Screen
        name="theme-select"
        options={{
          headerShown: false,
          title: 'Dark Mode',
        }}
      />
      <Stack.Screen
        name="data-storage"
        options={{
          headerShown: false,
          title: 'Data & Storage',
        }}
      />
      <Stack.Screen
        name="about-help"
        options={{
          headerShown: false,
          title: 'About & Help',
        }}
      />
      <Stack.Screen
        name="about-timelog"
        options={{
          headerShown: false,
          title: 'About TimeLog',
        }}
      />
      <Stack.Screen
        name="deleted-items"
        options={{
          headerShown: false, // Uses HeritageHeader
          title: 'Deleted Items',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          headerShown: false, // Uses HeritageHeader
          title: 'Notifications',
        }}
      />
    </Stack>
  );
}

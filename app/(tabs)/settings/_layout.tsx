import { Stack } from 'expo-router';

/**
 * Settings Stack Layout
 * This prevents nested settings screens from appearing as tabs
 */
export default function SettingsLayout(): JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Most screens handle their own header
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

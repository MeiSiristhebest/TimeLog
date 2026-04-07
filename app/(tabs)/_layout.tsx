import { Ionicons } from '@/components/ui/Icon';
import { Tabs } from 'expo-router';
import { HeritageTabBar } from '@/components/ui/heritage/HeritageTabBar';
import { useHeritageTheme } from '@/theme/heritage';

/**
 * Heritage Memoir Tab Bar Design
 * - 3 tabs only (Record, Stories, Settings)
 * - Custom animated tab bar with sliding indicator
 * - Icons: 28dp for better visibility
 * - Labels: 14pt Bold for readability
 */

// Larger icon size for elderly users
const ICON_SIZE = 28;

export default function TabsLayout(): JSX.Element {
  const theme = useHeritageTheme();

  return (
    <Tabs
      tabBar={(props) => <HeritageTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.handle,
        sceneStyle: {
          backgroundColor: theme.colors.surfaceDim,
        },
        headerStyle: {
          backgroundColor: theme.colors.surfaceDim, // Use Surface Dim for header
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          color: theme.colors.onSurface,
          fontSize: 20,
          fontFamily: 'Fraunces_700Bold', // Use Heritage Font
        },
        headerTintColor: theme.colors.onSurface,
      }}>
      {/* Tab 1: Record (Home - Core Function) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Record',
          headerShown: false,
          popToTopOnBlur: true,
          tabBarIcon: ({ color }) => <Ionicons name="mic" size={ICON_SIZE} color={color} />,
        }}
      />

      {/* Tab 2: Listen (Gallery) */}
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Listen',
          headerShown: false, // Use custom header inside gallery.tsx
          popToTopOnBlur: true,
          tabBarIcon: ({ color }) => <Ionicons name="headset" size={ICON_SIZE} color={color} />,
        }}
      />

      {/* Tab 3: Me (Settings) */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Me',
          headerShown: false,
          popToTopOnBlur: true,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={ICON_SIZE} color={color} />,
        }}
      />

      {/* Hidden routes - not shown in tab bar */}
      <Tabs.Screen
        name="topics"
        options={{
          href: null,
          headerShown: true,
          title: 'Topics',
        }}
      />

    </Tabs>
  );
}

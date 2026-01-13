import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

const TAB_COLORS = {
  active: '#C26B4A',
  inactive: '#8C7A6C',
  background: '#FFFAF5',
  border: '#E6DAD0',
  headerText: '#2C2C2C',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: TAB_COLORS.active,
        tabBarInactiveTintColor: TAB_COLORS.inactive,
        tabBarStyle: {
          backgroundColor: TAB_COLORS.background,
          borderTopColor: TAB_COLORS.border,
          height: 68,
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        headerStyle: {
          backgroundColor: TAB_COLORS.background,
        },
        headerTitleStyle: {
          color: TAB_COLORS.headerText,
          fontSize: 20,
          fontWeight: '700',
        },
        headerTintColor: TAB_COLORS.headerText,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, size }) => <Ionicons name="images" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: 'Topics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

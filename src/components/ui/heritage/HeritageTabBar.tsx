/**
 * HeritageTabBar - Custom animated tab bar component.
 * React Native 0.81 / Expo 54
 */

import { AppText } from '@/components/ui/AppText';
import { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@/components/ui/Icon';
import Animated, { useAnimatedStyle, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '@/theme/heritage';

const ICON_SIZE = 28;

// Colors from HTML design (updated for WCAG AA accessibility)

type TabConfig = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  badge?: number;
};

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: { name: 'index', icon: 'mic-outline', iconActive: 'mic', label: 'Record' },
  gallery: { name: 'gallery', icon: 'headset-outline', iconActive: 'headset', label: 'Listen' },
  settings: {
    name: 'settings',
    icon: 'person-circle-outline',
    iconActive: 'person-circle',
    label: 'Me',
  },
};

type TabItemProps = {
  route: BottomTabBarProps['state']['routes'][number];
  index: number;
  state: BottomTabBarProps['state'];
  navigation: BottomTabBarProps['navigation'];
};

function TabItem({ route, index, state, navigation }: TabItemProps): JSX.Element {
  const isFocused = state.index === index;
  const config = TAB_CONFIGS[route.name] || {
    icon: 'ellipse',
    iconActive: 'ellipse',
    label: route.name,
  };
  const theme = useHeritageTheme();
  const { colors, typography } = theme;
  const scale = typography.body / 24;

  // Theme-aware colors
  const activeColor = colors.primary;
  const inactiveColor = colors.textMuted;

  const handlePress = useCallback(() => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(route.name);
    }
  }, [isFocused, navigation, route]);

  const labelStyle = useAnimatedStyle(() => {
    return {
      // Tab Bar Physics - 300ms
      opacity: withTiming(isFocused ? 1 : 0.8, { duration: 300 }),
    };
  });

  return (
    <Pressable
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
      }}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={config.label}>
      {isFocused && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{
            position: 'absolute',
            top: -12,
            width: 48,
            height: 3,
            borderBottomLeftRadius: 6,
            borderBottomRightRadius: 6,
            backgroundColor: activeColor,
          }}
        />
      )}

      <View
        style={{
          marginBottom: 4,
          width: 30,
          height: 30,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Ionicons
          name={isFocused ? config.iconActive : config.icon}
          size={ICON_SIZE}
          color={isFocused ? activeColor : inactiveColor}
        />
      </View>

      <Animated.Text
        allowFontScaling={false}
        style={[
          {
            color: isFocused ? activeColor : inactiveColor,
            fontWeight: isFocused ? '700' : '500',
            fontSize: Math.round(12 * scale),
            letterSpacing: 0.3,
          },
          labelStyle,
        ]}>
        {config.label}
      </Animated.Text>

      {config.badge && config.badge > 0 && (
        <View
          style={{
            backgroundColor: colors.error,
            top: 4,
            right: 20,
            height: 16,
            minWidth: 16,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
            position: 'absolute',
          }}>
          <AppText style={{ color: colors.onPrimary }} className="text-[10px] font-bold">
            {config.badge > 9 ? '9+' : config.badge}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

export function HeritageTabBar({ state, descriptors, navigation }: BottomTabBarProps): JSX.Element {
  const insets = useSafeAreaInsets();
  const theme = useHeritageTheme();
  const { colors } = theme;

  // Filter out hidden tabs (topics, family)
  const visibleRoutes = state.routes.filter((route) => !['topics', 'family'].includes(route.name));

  // Calculate which visible tab is currently active
  const activeRoute = state.routes[state.index];
  const activeVisibleIndex = visibleRoutes.findIndex((route) => route.key === activeRoute?.key);

  // Create a modified state with the correct visible index for child components
  const visibleState = {
    ...state,
    index: activeVisibleIndex >= 0 ? activeVisibleIndex : 0,
    routes: visibleRoutes,
  };

  return (
    <View
      style={[
        {
          width: '100%',
          borderTopWidth: 1,
          paddingBottom: insets.bottom || 8,
          backgroundColor: theme.isDark ? colors.surfaceDim : colors.surface,
          borderTopColor: theme.isDark ? 'rgba(255,255,255,0.1)' : colors.border,
        },
      ]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingTop: 12,
          paddingBottom: 8,
        }}>
        {visibleRoutes.map((route, visibleIndex: number) => (
          <TabItem
            key={route.key}
            route={route}
            index={visibleIndex}
            state={visibleState}
            navigation={navigation}
          />
        ))}
      </View>
    </View>
  );
}

export default HeritageTabBar;

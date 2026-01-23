/**
 * HeritageTabBar - Custom animated tab bar component.
 * React Native 0.81 / Expo 54
 */

import { useCallback } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withTiming,
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useHeritageTheme } from '@/theme/heritage';

const ICON_SIZE = 28;

// Colors from HTML design
const COLORS = {
    primary: '#c36b4b',
    background: '#FFFAF5',
    border: '#eee9e6',
    inactive: '#9e9491',
};

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
    settings: { name: 'settings', icon: 'person-circle-outline', iconActive: 'person-circle', label: 'Me' },
};

type TabItemProps = {
    route: any;
    index: number;
    state: any;
    navigation: any;
};

function TabItem({ route, index, state, navigation }: TabItemProps) {
    const isFocused = state.index === index;
    const config = TAB_CONFIGS[route.name] || { icon: 'ellipse', iconActive: 'ellipse', label: route.name };
    const theme = useHeritageTheme();
    const { colors } = theme;

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
            opacity: withTiming(isFocused ? 1 : 0.8, { duration: 200 }),
        };
    });

    return (
        <Pressable
            style={styles.tabItem}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={config.label}
        >
            {/* Top Indicator Bar (Active State) */}
            {isFocused && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    style={[styles.topIndicator, { backgroundColor: COLORS.primary }]}
                />
            )}

            <View style={styles.iconContainer}>
                <Ionicons
                    name={isFocused ? config.iconActive : config.icon}
                    size={ICON_SIZE}
                    color={isFocused ? COLORS.primary : COLORS.inactive}
                />
            </View>

            <Animated.Text
                style={[
                    styles.label,
                    {
                        color: isFocused ? COLORS.primary : COLORS.inactive,
                        fontWeight: isFocused ? '700' : '500',
                    },
                    labelStyle,
                ]}
            >
                {config.label}
            </Animated.Text>

            {/* Badge */}
            {config.badge && config.badge > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                    <Text style={[styles.badgeText, { color: colors.onPrimary }]}>
                        {config.badge > 9 ? '9+' : config.badge}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}

export function HeritageTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const theme = useHeritageTheme();
    const { colors } = theme;

    // Filter out hidden tabs (topics, family)
    const visibleRoutes = state.routes.filter(
        (route: any) => !['topics', 'family'].includes(route.name)
    );

    // Calculate which visible tab is currently active
    const activeRoute = state.routes[state.index];
    const activeVisibleIndex = visibleRoutes.findIndex(
        (route: any) => route.key === activeRoute?.key
    );

    // Create a modified state with the correct visible index for child components
    const visibleState = {
        ...state,
        index: activeVisibleIndex >= 0 ? activeVisibleIndex : 0,
        routes: visibleRoutes,
    };

    return (
        <View
            style={[
                styles.container,
                {
                    paddingBottom: insets.bottom || 8,
                    backgroundColor: theme.isDark ? colors.surfaceDim : COLORS.background,
                    borderTopColor: theme.isDark ? 'rgba(255,255,255,0.1)' : COLORS.border,
                },
            ]}
        >
            <View style={styles.tabsContainer}>
                {visibleRoutes.map((route: any, visibleIndex: number) => (
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

const styles = StyleSheet.create({
    container: {
        alignSelf: 'stretch',
        borderTopWidth: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 12,
        paddingBottom: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    iconContainer: {
        height: 30,
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    topIndicator: {
        position: 'absolute',
        top: -12,
        width: 48,
        height: 3,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
    },
    label: {
        fontSize: 12,
        letterSpacing: 0.5,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 20,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default HeritageTabBar;

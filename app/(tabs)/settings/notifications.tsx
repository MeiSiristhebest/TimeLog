/**
 * Notification Settings Screen
 * 
 * Story 5.2: Smart Notification Engine (AC: 2)
 */

import { View, Text, Switch, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageTimePicker } from '@/components/ui/HeritageTimePicker';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useHeritageTheme } from '@/theme/heritage';
import {
    getNotificationSettings,
    updateNotificationSettings,
    getDeviceTimeZone,
} from '@/lib/notifications/notificationSettingsService';

export default function NotificationSettingsScreen() {
    const theme = useHeritageTheme();
    const sessionUserId = useAuthStore((state) => state.sessionUserId);
    const [enabled, setEnabled] = useState(true);
    const [gentleReminders, setGentleReminders] = useState(true);
    const [quietStart, setQuietStart] = useState(new Date());
    const [quietEnd, setQuietEnd] = useState(new Date());
    const [isLoading, setIsLoading] = useState(true);

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        if (!sessionUserId) return;

        setIsLoading(true);
        try {
            const settings = await getNotificationSettings(sessionUserId);

            if (settings) {
                setEnabled(settings.notificationsEnabled);
                setGentleReminders(settings.gentleRemindersEnabled);

                if (settings.quietHoursStart) {
                    const [hour, minute] = settings.quietHoursStart.split(':');
                    const start = new Date();
                    start.setHours(parseInt(hour), parseInt(minute), 0, 0);
                    setQuietStart(start);
                }

                if (settings.quietHoursEnd) {
                    const [hour, minute] = settings.quietHoursEnd.split(':');
                    const end = new Date();
                    end.setHours(parseInt(hour), parseInt(minute), 0, 0);
                    setQuietEnd(end);
                }
            } else {
                // Default quiet hours: 21:00 - 09:00
                const start = new Date();
                start.setHours(21, 0, 0, 0);
                setQuietStart(start);

                const end = new Date();
                end.setHours(9, 0, 0, 0);
                setQuietEnd(end);
            }
        } catch (error: any) {
            console.error('Failed to load notification settings:', error);
            HeritageAlert.show({
                title: 'Error',
                message: 'Failed to load settings',
                variant: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    }

    // State for HeritageTimePicker visibility
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const formatTime = (date: Date) => {
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    async function saveSettings() {
        if (!sessionUserId) return;

        try {
            const quietStartTime = `${quietStart.getHours().toString().padStart(2, '0')}:${quietStart.getMinutes().toString().padStart(2, '0')}`;
            const quietEndTime = `${quietEnd.getHours().toString().padStart(2, '0')}:${quietEnd.getMinutes().toString().padStart(2, '0')}`;

            await updateNotificationSettings({
                userId: sessionUserId,
                notificationsEnabled: enabled,
                gentleRemindersEnabled: gentleReminders,
                quietHoursStart: quietStartTime,
                quietHoursEnd: quietEndTime,
                timeZone: getDeviceTimeZone(),
            });

            HeritageAlert.show({
                title: 'Saved!',
                message: 'Notification settings have been updated.',
                variant: 'success',
            });
        } catch (error: any) {
            console.error('Failed to save notification settings:', error);
            HeritageAlert.show({
                title: 'Error',
                message: 'Failed to save settings',
                variant: 'error',
            });
        }
    }

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: theme.colors.onSurface }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
            <HeritageHeader
                title="Notifications"
                showBack
                scrollY={scrollY}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}
            />

            <Animated.ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 24, paddingTop: 100 }}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
            >
                <Text
                    style={{
                        fontSize: 28,
                        fontFamily: 'Fraunces_600SemiBold',
                        color: theme.colors.onSurface,
                        marginBottom: 8,
                    }}
                >
                    Notification Settings
                </Text>
                <Text
                    style={{
                        fontSize: 16,
                        color: `${theme.colors.onSurface}80`,
                        marginBottom: 24,
                    }}
                >
                    Manage how you receive updates from your family.
                </Text>

                {/* Enable/Disable */}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        shadowColor: theme.colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 18, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.onSurface }}>
                            Enable Notifications
                        </Text>
                        <Text style={{ fontSize: 14, color: `${theme.colors.onSurface}80`, marginTop: 4 }}>
                            Receive updates when family interacts
                        </Text>
                    </View>
                    <Switch
                        value={enabled}
                        onValueChange={setEnabled}
                        trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
                    />
                </View>

                {/* Gentle Reminders - Story 5.3 */}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        shadowColor: theme.colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 18, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.onSurface }}>
                            Gentle Reminders
                        </Text>
                        <Text style={{ fontSize: 14, color: `${theme.colors.onSurface}80`, marginTop: 4 }}>
                            Get a friendly nudge if you haven't recorded in a while
                        </Text>
                    </View>
                    <Switch
                        value={gentleReminders}
                        onValueChange={setGentleReminders}
                        trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
                    />
                </View>

                {/* Quiet Hours */}
                <Text
                    style={{
                        fontSize: 22,
                        fontFamily: 'Fraunces_600SemiBold',
                        color: theme.colors.onSurface,
                        marginBottom: 8,
                        marginTop: 16,
                    }}
                >
                    Quiet Hours
                </Text>
                <Text
                    style={{
                        fontSize: 14,
                        color: `${theme.colors.onSurface}80`,
                        marginBottom: 16,
                    }}
                >
                    Notifications will be queued during these hours and delivered when quiet hours end
                </Text>

                {/* Start Time */}
                <View
                    style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}
                >
                    <Text style={{ fontSize: 16, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.onSurface, marginBottom: 8 }}>
                        Start Time
                    </Text>
                    <Pressable
                        onPress={() => setShowStartPicker(true)}
                        style={{
                            backgroundColor: `${theme.colors.primary}10`,
                            borderRadius: 12,
                            padding: 16,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 28, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.primary }}>
                            {formatTime(quietStart)}
                        </Text>
                    </Pressable>
                </View>

                {/* End Time */}
                <View
                    style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        padding: 16,
                        marginBottom: 24,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}
                >
                    <Text style={{ fontSize: 16, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.onSurface, marginBottom: 8 }}>
                        End Time
                    </Text>
                    <Pressable
                        onPress={() => setShowEndPicker(true)}
                        style={{
                            backgroundColor: `${theme.colors.primary}10`,
                            borderRadius: 12,
                            padding: 16,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 28, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.primary }}>
                            {formatTime(quietEnd)}
                        </Text>
                    </Pressable>
                </View>

                {/* Heritage Time Pickers */}
                <HeritageTimePicker
                    visible={showStartPicker}
                    value={quietStart}
                    title="Quiet Hours Start"
                    onConfirm={(date) => {
                        setQuietStart(date);
                        setShowStartPicker(false);
                    }}
                    onCancel={() => setShowStartPicker(false)}
                />
                <HeritageTimePicker
                    visible={showEndPicker}
                    value={quietEnd}
                    title="Quiet Hours End"
                    onConfirm={(date) => {
                        setQuietEnd(date);
                        setShowEndPicker(false);
                    }}
                    onCancel={() => setShowEndPicker(false)}
                />

                {/* Save Button */}
                <HeritageButton
                    title="Save Settings"
                    onPress={saveSettings}
                    variant="primary"
                    style={{ marginBottom: 40 }}
                />
            </Animated.ScrollView>
        </View>
    );
}

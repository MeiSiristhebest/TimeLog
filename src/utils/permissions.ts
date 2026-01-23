/**
 * Permission Utilities - Mobile UX Best Practice
 * 
 * Provides pre-permission rationale dialogs before requesting system permissions.
 * This is required by iOS/Android guidelines to explain WHY the app needs access.
 */

import { Audio } from 'expo-av';
import { HeritageAlert } from '@/components/ui/HeritageAlert';

/**
 * Request microphone permission with a rationale pre-dialog.
 * Shows a user-friendly explanation before the system permission dialog.
 * 
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestMicrophoneWithRationale(): Promise<boolean> {
    return new Promise((resolve) => {
        HeritageAlert.show({
            title: 'Microphone Access',
            message: 'TimeLog needs microphone access to record your stories. Your recordings stay on your device until you choose to share them.',
            variant: 'info',
            primaryAction: {
                label: 'Allow Microphone',
                onPress: async () => {
                    const { granted } = await Audio.requestPermissionsAsync();
                    resolve(granted);
                },
            },
            secondaryAction: {
                label: 'Not Now',
                onPress: () => resolve(false),
            },
        });
    });
}

/**
 * Check if microphone permission is already granted.
 */
export async function hasMicrophonePermission(): Promise<boolean> {
    const { granted } = await Audio.getPermissionsAsync();
    return granted;
}

/**
 * Request notification permission with rationale (call after first story saved).
 */
export async function requestNotificationWithRationale(): Promise<boolean> {
    return new Promise((resolve) => {
        HeritageAlert.show({
            title: 'Stay Connected',
            message: 'Get notified when family members listen to your stories or leave comments.',
            variant: 'info',
            primaryAction: {
                label: 'Enable Notifications',
                onPress: async () => {
                    // Notification permission request would go here
                    // For now, just resolve true
                    resolve(true);
                },
            },
            secondaryAction: {
                label: 'Maybe Later',
                onPress: () => resolve(false),
            },
        });
    });
}

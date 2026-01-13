import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

/**
 * Hook that handles deep linking and clipboard "TaoKouLing" detection for family invites.
 * Extracts business logic from Root Layout per Architecture requirements.
 */
export const useDeepLinkHandler = () => {
    const router = useRouter();
    const lastHandledToken = useRef<string | null>(null);

    useEffect(() => {
        const handleUrl = (url?: string | null) => {
            if (!url) return false;

            console.log('[DeepLink] Processing URL:', url);

            const parsed = Linking.parse(url);
            const { path, hostname, queryParams } = parsed;
            const normalizedPath = (path || hostname || '').replace(/^\/+/, '').replace(/\/+$/, '');
            // Handle expo dev client prefix --/
            const cleanedPath = normalizedPath.startsWith('--/')
                ? normalizedPath.slice(3)
                : normalizedPath;
            const token = queryParams?.token;

            console.log('[DeepLink] Cleaned path:', cleanedPath, 'Token:', token);

            if (cleanedPath === 'accept-invite' && typeof token === 'string' && token.length > 0) {
                if (lastHandledToken.current === token) return true; // Prevent duplicate handling
                lastHandledToken.current = token;
                console.log('[DeepLink] Navigating to accept-invite');
                router.replace(`/accept-invite?token=${encodeURIComponent(token)}`);
                return true;
            }
            return false;
        };

        // Handle cold start
        Linking.getInitialURL().then((url) => {
            console.log('[DeepLink] Initial URL:', url);
            handleUrl(url);
        });

        // Handle warm start (app in background)
        const linkSub = Linking.addEventListener('url', ({ url }) => {
            console.log('[DeepLink] Event URL:', url);
            handleUrl(url);
        });

        // "TaoKouLing" (Clipboard Sniffing) Logic
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                try {
                    const content = await Clipboard.getStringAsync();
                    if (!content) return;

                    // Match timelog://accept-invite?token=ABC or just token=ABC in text
                    // Regex looks for: token=([alphanumeric]) but ignores if it's just a random string
                    // We look for specifically our scheme OR a pattern we define in invite.tsx

                    // Pattern: "Join my family ... token=XXX" or raw URL
                    const match = content.match(/(?:token=|token%3D)([a-fA-F0-9]{24,})/);
                    // Assuming token is hex string from pgcrypto gen_random_bytes(12) -> 24 chars hex

                    if (match && match[1]) {
                        const token = match[1];
                        if (lastHandledToken.current === token) return; // Already handled this token

                        // Ask user if they want to accept
                        Alert.alert(
                            'Family Invite Detected',
                            'Do you want to join the family account?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Join',
                                    onPress: () => {
                                        handleUrl(`timelog://accept-invite?token=${token}`);
                                        // Clear clipboard to avoid asking again? Optional.
                                        // Clipboard.setStringAsync('');
                                    },
                                },
                            ]
                        );
                    }
                } catch (e) {
                    console.log('[Clipboard] Error reading clipboard', e);
                }
            }
        };

        const appStateSub = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            linkSub.remove();
            appStateSub.remove();
        };
    }, [router]);
};

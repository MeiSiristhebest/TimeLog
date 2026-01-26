import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { devLog } from '@/lib/devLogger';

/**
 * Hook that handles deep linking and clipboard "TaoKouLing" detection for family invites.
 * Extracts business logic from Root Layout per Architecture requirements.
 */
export function useDeepLinkHandler(): void {
  const router = useRouter();
  const lastHandledToken = useRef<string | null>(null);

  useEffect(() => {
    // NOTE: We rely on Expo Router for standard deep linking handling.
    // We only implement Clipboard sniffing ("TaoKouLing") here.

    // Helper to handle manual navigation if needed (for clipboard)
    const handleUrl = (url?: string | null) => {
      if (!url) return false;

      devLog.info('[DeepLink] Processing URL from Clipboard:', url);

      const parsed = Linking.parse(url);
      const { path, hostname, queryParams } = parsed;
      const normalizedPath = (path || hostname || '').replace(/^\/+/, '').replace(/\/+$/, '');
      const cleanedPath = normalizedPath.startsWith('--/')
        ? normalizedPath.slice(3)
        : normalizedPath;
      const token = queryParams?.token;

      if (cleanedPath === 'accept-invite' && typeof token === 'string' && token.length > 0) {
        if (lastHandledToken.current === token) return true;
        lastHandledToken.current = token;
        router.replace(`/accept-invite?token=${encodeURIComponent(token)}`);
        return true;
      }
      return false;
    };

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
            Alert.alert('Family Invite Detected', 'Do you want to join the family account?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Join',
                onPress: () => {
                  handleUrl(`timelog://accept-invite?token=${token}`);
                  // Clear clipboard to avoid asking again? Optional.
                  // Clipboard.setStringAsync('');
                },
              },
            ]);
          }
        } catch (e) {
          devLog.info('[Clipboard] Error reading clipboard', e);
        }
      }
    };

    const appStateSub = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSub.remove();
    };
  }, [router]);
}

import { useEffect } from 'react';
import { Text, View, TextProps } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '../global.css';
import '@/lib/logger';
import { useDbMigrations } from '@/db/useMigrations';
import { useDeepLinkHandler } from '@/features/auth/hooks/useDeepLinkHandler';
import { useSyncStore } from '@/lib/sync-engine/store';
import { ToastProvider } from '@/components/ui/feedback/ToastProvider';
import { OfflineBanner } from '@/components/ui/feedback/OfflineBanner';
import { useNotifications, NotificationBanner } from '@/features/family-listener';
import { HeritageAlertProvider, setGlobalAlertRef, useHeritageAlert } from '@/components/ui/HeritageAlert';
import { PALETTE } from '@/theme/heritage';

// Mobile UX: Enable Dynamic Type for accessibility (iOS system font scaling)
// maxFontSizeMultiplier prevents extreme scaling from breaking layouts
(Text as any).defaultProps = {
  ...((Text as any).defaultProps || {}),
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.5,
};

const queryClient = new QueryClient();

// Inner component to access HeritageAlert context
function AppContent() {
  const alertContext = useHeritageAlert();

  // Set global alert ref for imperative usage
  useEffect(() => {
    setGlobalAlertRef(alertContext);
  }, [alertContext]);

  return null;
}

export default function RootLayout() {
  const { success, error } = useDbMigrations();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_600SemiBold,
  });

  // Push notification handling
  const {
    foregroundNotification,
    dismissForegroundNotification,
    navigateToNotification,
  } = useNotifications();

  // Initialize Sync Engine listeners
  useEffect(() => {
    const initializeListeners = useSyncStore.getState().initializeListeners;
    const cleanupListeners = useSyncStore.getState().cleanupListeners;

    initializeListeners();
    return () => cleanupListeners();
  }, []);

  // Deep link and clipboard "TaoKouLing" handling extracted to hook
  useDeepLinkHandler();

  if (error || fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initialization Error: {error?.message || fontError?.message}</Text>
      </View>
    );
  }

  if (!success || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Initializing...</Text>
      </View>
    );
  }

  return (
    <HeritageAlertProvider>
      <AppContent />
      <ToastProvider>
        <OfflineBanner />
        {/* Foreground notification banner */}
        {foregroundNotification && (
          <NotificationBanner
            title={foregroundNotification.title}
            body={foregroundNotification.body}
            data={foregroundNotification.data}
            onPress={navigateToNotification}
            onDismiss={dismissForegroundNotification}
          />
        )}
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              // Heritage custom transitions
              animation: 'slide_from_right',
              animationDuration: 250,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              // Heritage header styling - using theme colors
              headerStyle: {
                backgroundColor: PALETTE.surfaceDim,
              },
              headerTintColor: PALETTE.primary,
              headerTitleStyle: {
                color: PALETTE.onSurface,
                fontWeight: '600',
                fontSize: 18,
              },
              headerShadowVisible: false,
              // Content styling
              contentStyle: {
                backgroundColor: PALETTE.surfaceDim,
              },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="details"
              options={{
                title: 'Details',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen name="login" options={{ title: 'Login' }} />
            <Stack.Screen name="device-management" options={{ headerShown: false }} />
            <Stack.Screen name="invite" options={{ headerShown: false }} />
            <Stack.Screen name="accept-invite" options={{ headerShown: false }} />
            <Stack.Screen name="ask-question" options={{ headerShown: false }} />
            <Stack.Screen name="role" options={{ headerShown: false }} />
            <Stack.Screen name="device-code" options={{ headerShown: false }} />
            {/* New Me screen sub-routes with custom HeritageHeader */}
            <Stack.Screen name="help" options={{ headerShown: false }} />
            <Stack.Screen name="consent-review" options={{ headerShown: false }} />
            <Stack.Screen name="family-members" options={{ headerShown: false }} />
            <Stack.Screen name="recovery-code" options={{ headerShown: false }} />
            <Stack.Screen
              name="splash"
              options={{
                headerShown: false,
                animation: 'fade',
              }}
            />
            <Stack.Screen
              name="welcome"
              options={{
                headerShown: false,
                animation: 'fade',
              }}
            />
          </Stack>
        </QueryClientProvider>
      </ToastProvider>
    </HeritageAlertProvider>
  );
}

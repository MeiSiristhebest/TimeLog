import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import {
  useFonts,
  Fraunces_300Light,
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../global.css';
import '@/lib/logger';
import { useDbMigrations } from '@/db/useMigrations';
import { useDeepLinkHandler } from '@/features/auth/hooks/useDeepLinkHandler';
import { useSyncStore } from '@/lib/sync-engine/store';
import { registerSyncSoundCues } from '@/lib/sync-engine/soundCues';
import { ToastProvider } from '@/components/ui/feedback/ToastProvider';
import { OfflineBanner } from '@/components/ui/feedback/OfflineBanner';
import { useNotifications, NotificationBanner } from '@/features/family-listener';
import { HeritageAlertProvider } from '@/components/ui/HeritageAlert';
import { useHeritageTheme } from '@/theme/heritage';
import { setBackgroundColorAsync } from 'expo-system-ui';
import { playOfflineCue, playOnlineCue } from '@/features/recorder/services/soundCueService';
import { initializeOnlineManager, cleanupOnlineManager } from '@/lib/react-query/onlineManager';
import { PortalProvider } from '@gorhom/portal';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60, // 1 minute
    },
  },
});

export default function RootLayout() {
  const { colors } = useHeritageTheme();
  const [fontsLoaded] = useFonts({
    Fraunces_300Light,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Caveat_700Bold,
  });

  // DB Migrations
  const { success: dbReady, error: dbError } = useDbMigrations();

  // Deep Link Handler
  useDeepLinkHandler();

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  // Set root background color to match theme
  useEffect(() => {
    setBackgroundColorAsync(colors.surfaceDim);
  }, [colors.surfaceDim]);

  // Online Manager Setup
  useEffect(() => {
    initializeOnlineManager();
    return () => cleanupOnlineManager();
  }, []);

  // Sync Engine Setup
  useEffect(() => {
    registerSyncSoundCues({ playOnlineCue, playOfflineCue });
    useSyncStore.getState().initializeListeners();
    return () => {
      registerSyncSoundCues(null);
      useSyncStore.getState().cleanupListeners();
    };
  }, []);

  const onLayoutRootView = async () => {
    if (fontsLoaded && dbReady) {
      await SplashScreen.hideAsync();
    }
  };

  // Safe fail for DB errors
  if (dbError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text>Database Initialization Failed</Text>
        <Text>{dbError.message}</Text>
      </View>
    );
  }

  if (!fontsLoaded || !dbReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HeritageAlertProvider>
        <ToastProvider>
          <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <PortalProvider>
              <RootLayoutContent />
            </PortalProvider>
          </GestureHandlerRootView>
        </ToastProvider>
      </HeritageAlertProvider>
    </QueryClientProvider>
  );
}

function RootLayoutContent() {
  const { colors } = useHeritageTheme();

  // Notification listeners
  const { foregroundNotification, navigateToNotification, dismissForegroundNotification } = useNotifications();

  // Network status listeners for cues
  useEffect(() => {
    // Implementation details can be added here if needed
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceDim }}>
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

      <Stack
        screenOptions={{
          // Heritage custom transitions
          animation: 'slide_from_right',
          animationDuration: 400, // Slower, more elegant
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerShown: false, // Default to no header globally
          // Heritage header styling - using theme colors
          headerStyle: {
            backgroundColor: colors.surfaceDim,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            color: colors.onSurface,
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="details"
          options={{
            title: 'Details',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="(auth)/login" options={{ title: 'Login' }} />
        <Stack.Screen name="device-management" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/invite" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/accept-invite" options={{ headerShown: false }} />
        <Stack.Screen name="ask-question" options={{ headerShown: false }} />
        <Stack.Screen name="role" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/device-code" options={{ headerShown: false }} />
        {/* New Me screen sub-routes with custom HeritageHeader */}
        <Stack.Screen name="(auth)/help" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/consent-review" options={{ headerShown: false }} />
        <Stack.Screen name="family-members" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/recovery-code" options={{ headerShown: false }} />
        <Stack.Screen name="story/[id]" />
        <Stack.Screen name="story-comments/[id]" />
        <Stack.Screen name="family-story/[id]" />
        <Stack.Screen name="upgrade-account" />
        <Stack.Screen
          name="splash"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="(auth)/welcome"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
      </Stack>
    </View>
  );
}

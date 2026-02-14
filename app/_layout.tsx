import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import {
  useFonts,
  Fraunces_300Light,
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { QueryClientProvider } from '@tanstack/react-query';
import '../global.css';
import '@/lib/logger';
import { useDbMigrations } from '@/db/useMigrations';
import { ToastProvider } from '@/components/ui/feedback/ToastProvider';
import { OfflineBanner } from '@/components/ui/feedback/OfflineBanner';
import { useNotifications, NotificationBanner } from '@/features/family-listener';
import { HeritageAlertProvider } from '@/components/ui/HeritageAlert';
import { useHeritageTheme } from '@/theme/heritage';
import { PortalProvider } from '@gorhom/portal';
import { Text, View } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { bootstrapNativeRuntime } from '@/features/app/bootstrap';
import { queryClient } from '@/features/app/queryClient';
import { useRootAppLifecycle } from '@/features/app/hooks/useRootAppLifecycle';
import {
  getRootStackDefaultScreenOptions,
  ROOT_STACK_ROUTES,
} from '@/features/app/navigation/rootStackConfig';

bootstrapNativeRuntime();

export default function RootLayout() {
  const { colors, isDark } = useHeritageTheme();
  const [fontsLoaded] = useFonts({
    Fraunces_300Light,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Caveat_700Bold,
  });

  // DB Migrations
  const { success: dbReady, error: dbError } = useDbMigrations();

  const { onLayoutRootView } = useRootAppLifecycle({
    fontsLoaded,
    dbReady,
    surfaceColor: colors.surfaceDim,
  });

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
          <GestureHandlerRootView
            style={{ flex: 1, backgroundColor: colors.surfaceDim }}
            onLayout={onLayoutRootView}>
            <PortalProvider>
              <RootLayoutContent isDark={isDark} />
            </PortalProvider>
          </GestureHandlerRootView>
        </ToastProvider>
      </HeritageAlertProvider>
    </QueryClientProvider>
  );
}

function RootLayoutContent({ isDark }: { readonly isDark: boolean }) {
  const { colors } = useHeritageTheme();
  const navigationTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.surfaceDim,
      card: colors.surfaceDim,
      text: colors.onSurface,
      border: colors.border,
      notification: colors.primary,
    },
  };

  // Notification listeners
  const { foregroundNotification, navigateToNotification, dismissForegroundNotification } =
    useNotifications();

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

      <ThemeProvider value={navigationTheme}>
        <Stack screenOptions={getRootStackDefaultScreenOptions(colors)}>
          {ROOT_STACK_ROUTES.map((route) => (
            <Stack.Screen key={route.name} name={route.name as never} options={route.options} />
          ))}
        </Stack>
      </ThemeProvider>
    </View>
  );
}

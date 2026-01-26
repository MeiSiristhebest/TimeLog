import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? Constants.expoConfig?.extra?.sentryDsn ?? '';

const SENTRY_ENABLED = !!DSN;

Sentry.init({
  dsn: DSN,
  enabled: SENTRY_ENABLED,
  enableNative: true,
  tracesSampleRate: 0.1,
  enableAutoPerformanceTracing: false,
  debug: false,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.user) {
      event.user.email = undefined;
      event.user.username = undefined;
      event.user.ip_address = undefined;
    }
    if (event.request) {
      event.request.headers = undefined;
      event.request.cookies = undefined;
    }
    return event;
  },
});

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (!error) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

export function isSentryEnabled(): boolean {
  return SENTRY_ENABLED;
}

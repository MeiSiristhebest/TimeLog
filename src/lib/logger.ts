import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? Constants.expoConfig?.extra?.sentryDsn ?? '';

const SENTRY_ENABLED = !!DSN;

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveKeys = ['transcription', 'text', 'content', 'email', 'password', 'token', 'key', 'secret'];
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeObject(value);
    }
  }
  return sanitized;
}

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
    
    // Sanitize extra context and breadcrumbs to protect user privacy
    if (event.extra) {
      event.extra = sanitizeObject(event.extra);
    }
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.data) {
          breadcrumb.data = sanitizeObject(breadcrumb.data);
        }
        return breadcrumb;
      });
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

/**
 * HeritageAlert - Custom alert component replacing native Alert.alert().
 *
 * Features:
 * - Heritage Memoir design system
 * - Icon variants (success, warning, error, info)
 * - Primary/Secondary action buttons
 * - 56dp touch targets for elderly users
 * - Smooth animations
 *
 * @example
 * // Simple info alert
 * HeritageAlert.show({
 *   title: 'Success',
 *   message: 'Your story has been saved.',
 * });
 *
 * // Confirm alert with actions
 * HeritageAlert.show({
 *   title: 'Sign Out?',
 *   message: 'You will need to sign in again.',
 *   variant: 'warning',
 *   primaryAction: { label: 'Sign Out', onPress: handleSignOut },
 *   secondaryAction: { label: 'Cancel' },
 * });
 */

import { AppText } from '@/components/ui/AppText';
import { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react';
import { Alert, View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@/components/ui/Icon';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { HeritageModal } from './HeritageModal';
import { devLog } from '@/lib/devLogger';

// Heritage Memoir Design Tokens
const TOKENS = {
  primary: '#B85A3B',
  onPrimary: '#FFFFFF',
  surface: '#FFFCF7',
  onSurface: '#1E293B',
  textMuted: '#475569',
  error: '#B84A4A',
  warning: '#C49832',
  success: '#6B8E6B',
  info: '#5B8FB9',
  border: '#E2E8F0',
} as const;
type AlertVariant = 'info' | 'success' | 'warning' | 'error';

type AlertAction = {
  label: string;
  onPress?: () => void;
  /** Whether this is a destructive action (shown in red) */
  destructive?: boolean;
};

type AlertConfig = {
  title: string;
  message?: string;
  variant?: AlertVariant;
  primaryAction?: AlertAction;
  secondaryAction?: AlertAction;
  /** Whether to show close button (default: true for info only) */
  showCloseButton?: boolean;
};

type AlertContextType = {
  show: (config: AlertConfig) => void;
  hide: () => void;
};

const AlertContext = createContext<AlertContextType | null>(null);

// Icon mapping for variants
const VARIANT_ICONS: Record<AlertVariant, { name: keyof typeof Ionicons.glyphMap; color: string }> =
{
  info: { name: 'information-circle', color: TOKENS.info },
  success: { name: 'checkmark-circle', color: TOKENS.success },
  warning: { name: 'warning', color: TOKENS.warning },
  error: { name: 'alert-circle', color: TOKENS.error },
};

/**
 * Alert content component
 */
function AlertContent({
  config,
  onClose,
}: {
  config: AlertConfig;
  onClose: () => void;
}): JSX.Element {
  const { title, message, variant = 'info', primaryAction, secondaryAction } = config;
  const iconConfig = VARIANT_ICONS[variant];

  // Button press animation
  const primaryScale = useSharedValue(1);
  const secondaryScale = useSharedValue(1);

  const handlePrimaryPress = useCallback(() => {
    primaryScale.value = withSequence(
      withTiming(0.95, { duration: 50 }),
      withTiming(1, { duration: 100 })
    );
    primaryAction?.onPress?.();
    onClose();
  }, [primaryAction, onClose, primaryScale]);

  const handleSecondaryPress = useCallback(() => {
    secondaryScale.value = withSequence(
      withTiming(0.95, { duration: 50 }),
      withTiming(1, { duration: 100 })
    );
    secondaryAction?.onPress?.();
    onClose();
  }, [secondaryAction, onClose, secondaryScale]);

  const handleOkPress = useCallback(() => {
    onClose();
  }, [onClose]);

  const primaryButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: primaryScale.value }],
  }));

  const secondaryButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: secondaryScale.value }],
  }));

  const hasTwoButtons = primaryAction && secondaryAction;
  const hasOnlyPrimary = primaryAction && !secondaryAction;
  const showDefaultOk = !primaryAction && !secondaryAction;

  return (
    <View className="items-center p-6">
      {/* Icon */}
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: `${iconConfig.color}15` }}>
        <Ionicons name={iconConfig.name} size={32} color={iconConfig.color} />
      </View>

      {/* Title */}
      <AppText
        className="mb-2 text-center text-2xl font-semibold"
        style={{ fontFamily: 'Fraunces_600SemiBold', color: TOKENS.onSurface }}>
        {title}
      </AppText>

      {/* Message */}
      {message && (
        <AppText
          className="mb-6 text-center text-lg leading-7"
          style={{ color: TOKENS.textMuted }}>
          {message}
        </AppText>
      )}

      {/* Actions */}
      <View className="w-full flex-row gap-3">
        {/* Two button layout */}
        {hasTwoButtons && (
          <>
            <Animated.View className="flex-1" style={secondaryButtonStyle}>
              <Pressable
                className="min-h-[56px] items-center justify-center rounded-2xl border-[1.5px] px-6 py-4"
                style={{ borderColor: TOKENS.border, backgroundColor: 'transparent' }}
                onPress={handleSecondaryPress}
                accessibilityRole="button"
                accessibilityLabel={secondaryAction.label}>
                <AppText className="text-lg font-semibold" style={{ color: TOKENS.textMuted }}>{secondaryAction.label}</AppText>
              </Pressable>
            </Animated.View>

            <Animated.View className="flex-1" style={primaryButtonStyle}>
              <Pressable
                className="min-h-[56px] items-center justify-center rounded-2xl px-6 py-4 shadow-sm elevation-[4]"
                style={{
                  backgroundColor: primaryAction.destructive ? TOKENS.error : TOKENS.primary,
                  shadowColor: primaryAction.destructive ? TOKENS.error : TOKENS.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                }}
                onPress={handlePrimaryPress}
                accessibilityRole="button"
                accessibilityLabel={primaryAction.label}>
                <AppText className="text-lg font-semibold" style={{ color: TOKENS.onPrimary }}>{primaryAction.label}</AppText>
              </Pressable>
            </Animated.View>
          </>
        )}

        {/* Single primary button */}
        {hasOnlyPrimary && (
          <Animated.View className="w-full" style={primaryButtonStyle}>
            <Pressable
              className="w-full min-h-[56px] items-center justify-center rounded-2xl px-6 py-4 shadow-sm elevation-[4]"
              style={{
                backgroundColor: primaryAction.destructive ? TOKENS.error : TOKENS.primary,
                shadowColor: primaryAction.destructive ? TOKENS.error : TOKENS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              }}
              onPress={handlePrimaryPress}
              accessibilityRole="button"
              accessibilityLabel={primaryAction.label}>
              <AppText className="text-lg font-semibold" style={{ color: TOKENS.onPrimary }}>{primaryAction.label}</AppText>
            </Pressable>
          </Animated.View>
        )}

        {/* Default OK button */}
        {showDefaultOk && (
          <Pressable
            className="w-full min-h-[56px] items-center justify-center rounded-2xl px-6 py-4 shadow-sm elevation-[4]"
            style={{
              backgroundColor: TOKENS.primary,
              shadowColor: TOKENS.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            }}
            onPress={handleOkPress}
            accessibilityRole="button"
            accessibilityLabel="OK">
            <AppText className="text-lg font-semibold" style={{ color: TOKENS.onPrimary }}>OK</AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * HeritageAlert Provider - Wrap your app with this
 */
export function HeritageAlertProvider({ children }: { children: ReactNode }): JSX.Element {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const show = useCallback((alertConfig: AlertConfig) => {
    setConfig(alertConfig);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    setVisible(false);
    // Clear config after animation completes
    setTimeout(() => setConfig(null), 250);
  }, []);

  const contextValue = { show, hide };

  // Register global ref per requirements
  useEffect(() => {
    setGlobalAlertRef(contextValue);
    return () => setGlobalAlertRef({ show: () => { }, hide: () => { } } as any);
  }, [show, hide]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <HeritageModal
        visible={visible}
        onClose={hide}
        closeOnBackdrop={false}
        accessibilityLabel={config?.title ?? 'Alert'}>
        {config && <AlertContent config={config} onClose={hide} />}
      </HeritageModal>
    </AlertContext.Provider>
  );
}

/**
 * Hook to use HeritageAlert
 */
export function useHeritageAlert(): AlertContextType {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useHeritageAlert must be used within HeritageAlertProvider');
  }
  return context;
}

/**
 * Static methods for imperative usage (requires Provider)
 */
let globalAlertRef: AlertContextType | null = null;

export function setGlobalAlertRef(ref: AlertContextType): void {
  globalAlertRef = ref;
}

export const HeritageAlert = {
  show: (config: AlertConfig) => {
    if (!globalAlertRef) {
      devLog.warn('HeritageAlert: No provider found. Falling back to native Alert.');
      // Fallback to native Alert
      Alert.alert(config.title, config.message);
      return;
    }
    globalAlertRef.show(config);
  },
  hide: () => {
    globalAlertRef?.hide();
  },
};

export default HeritageAlert;

import { AppText } from '@/components/ui/AppText';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ViewStyle } from 'react-native';
import { Animated } from '@/tw/animated';
import { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { registerToastListener, ToastOptions, ToastType } from './toast';
import { triggerHaptic } from '@/utils/haptics';
import { useHeritageTheme } from '@/theme/heritage';

const TOAST_DURATION_SHORT = 2000;
const TOAST_DURATION_LONG = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const { colors } = useHeritageTheme();

  useEffect(() => {
    const unregister = registerToastListener((options) => {
      setToast(options);

      // Haptic feedback based on type
      if (options.type === 'error') {
        triggerHaptic.error();
      } else if (options.type === 'success') {
        triggerHaptic.success();
      } else if (options.type === 'warning') {
        triggerHaptic.warning();
      } else {
        triggerHaptic.selection();
      }

      // Auto dismiss
      const duration = options.duration === 'long' ? TOAST_DURATION_LONG : TOAST_DURATION_SHORT;
      const timer = setTimeout(() => {
        setToast(null);
      }, duration);

      return () => clearTimeout(timer);
    });

    return unregister;
  }, []);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  const toastPalette = toast ? getToastPalette(toast.type, colors) : null;

  // FIX: Don't wrap children in an absolute view effectively blocking clicks or layout if styling fails
  // Instead, render children normally and render Toast as a sibling overlay
  return (
    <>
      {children}
      {toast && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }} pointerEvents="box-none">
          <SafeAreaView pointerEvents="box-none" style={{ alignItems: 'center', paddingTop: Platform.OS === 'android' ? 40 : 0 }}>
            <Animated.View
              entering={FadeInUp.springify()}
              exiting={FadeOutUp}
              className="flex-row items-center justify-between w-[90%] max-w-[400px] py-3 px-4 rounded-xl mt-2 shadow-sm elevation-[6]"
                style={[
                toastPalette ? { backgroundColor: toastPalette.backgroundColor } : undefined,
                {
                  shadowColor: colors.shadowNeutral,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8
                }
              ]}>
              <View className="flex-1 flex-row items-center gap-3">
                <Ionicons
                  name={getIconName(toast.type)}
                  size={24}
                  color={toastPalette?.foregroundColor ?? colors.onSurface}
                />
                <AppText
                  className="flex-1 text-base font-medium"
                  style={{
                    color: toastPalette?.foregroundColor ?? colors.onSurface,
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  }}>
                  {toast.message}
                </AppText>
              </View>
              <TouchableOpacity onPress={dismiss} hitSlop={12}>
                <Ionicons
                  name="close"
                  size={20}
                  color={toastPalette?.foregroundColor ?? colors.onSurface}
                  style={{ opacity: 0.8 }}
                />
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </View>
      )}
    </>
  );
}

function getToastPalette(
  type: ToastType | undefined,
  colors: ReturnType<typeof useHeritageTheme>['colors']
): { backgroundColor: ViewStyle['backgroundColor']; foregroundColor: string } {
  switch (type) {
    case 'error':
      return { backgroundColor: colors.error, foregroundColor: colors.onPrimary };
    case 'success':
      return { backgroundColor: colors.success, foregroundColor: colors.onPrimary };
    case 'warning':
      return { backgroundColor: colors.warning, foregroundColor: colors.onPrimary };
    case 'info':
    default:
      return { backgroundColor: colors.surfaceCard, foregroundColor: colors.onSurface };
  }
}

function getIconName(type?: ToastType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'error':
      return 'alert-circle';
    case 'success':
      return 'checkmark-circle';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'information-circle';
  }
}

import { AppText } from '@/components/ui/AppText';
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ViewStyle } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Ionicons } from '@/components/ui/Icon';
import { registerToastListener, ToastOptions, ToastType } from './toast';
import { triggerHaptic } from '@/utils/haptics';

const TOAST_DURATION_SHORT = 2000;
const TOAST_DURATION_LONG = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [toast, setToast] = useState<ToastOptions | null>(null);

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

  return (
    <View style={StyleSheet.absoluteFill}>
      {children}
      {toast && (
        <SafeAreaView pointerEvents="box-none" style={styles.container}>
          <Animated.View
            entering={FadeInUp.springify()}
            exiting={FadeOutUp}
            style={[styles.toast, getToastStyle(toast.type)]}>
            <View style={styles.content}>
              <Ionicons name={getIconName(toast.type)} size={24} color="#FFF" />
              <AppText style={styles.message}>{toast.message}</AppText>
            </View>
            <TouchableOpacity onPress={dismiss} hitSlop={12}>
              <Ionicons name="close" size={20} color="#FFF" style={{ opacity: 0.8 }} />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      )}
    </View>
  );
}

function getToastStyle(type?: ToastType): ViewStyle {
  switch (type) {
    case 'error':
      return { backgroundColor: '#B84A4A' }; // Heritage error
    case 'success':
      return { backgroundColor: '#7D9D7A' }; // Success
    case 'warning':
      return { backgroundColor: '#D4A012' }; // Warning
    case 'info':
    default:
      return { backgroundColor: '#333333' }; // Neutral
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    paddingTop: Platform.OS === 'android' ? 40 : 0, // Extra padding for Android status bar
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
    maxWidth: 400,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  message: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
});

import { AppText } from '@/components/ui/AppText';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@/components/ui/Icon';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useHeritageTheme } from '@/theme/heritage';

export function OfflineBanner(): JSX.Element | null {
  const { colors } = useHeritageTheme();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Only show if explicitly disconnected (null is usually loading state)
      const offline = state.isConnected === false;
      setIsOffline(offline);
    });
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <SafeAreaView pointerEvents="none" style={styles.container}>
      <Animated.View
        entering={FadeInUp.springify()}
        exiting={FadeOutUp}
        style={[styles.toast, { backgroundColor: colors.surfaceDim, shadowColor: colors.shadow }]}>
        <View style={styles.content}>
          <Ionicons
            name="wifi"
            size={20}
            color={colors.onSurface}
            style={{ transform: [{ rotate: '90deg' }], opacity: 0.5 }}
          />
          <Ionicons
            name="close"
            size={14}
            color={colors.onSurface}
            style={{ position: 'absolute', left: 8, top: 4 }}
          />
          {/* Combining icons to simulate wifi_off or use cloud-offline */}
          <AppText style={[styles.message, { color: colors.onSurface }]}>
            Please check your Wi-Fi.
          </AppText>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Top offset to simulate "pt-14"
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, // shadow-xl
    shadowRadius: 10,
    elevation: 8,
    maxWidth: 384, // max-w-sm
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  message: {
    fontSize: 16, // text-base
    fontWeight: '500',
    lineHeight: 20,
  },
});

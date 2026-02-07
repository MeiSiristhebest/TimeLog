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
    <SafeAreaView
      pointerEvents="none"
      style={{ position: 'absolute', top: 56, left: 0, right: 0, zIndex: 50 }}>
      <View className="items-center px-4">
      <Animated.View
        entering={FadeInUp.springify()}
        exiting={FadeOutUp}
        className="w-full max-w-sm rounded-[8px] py-3 px-5 flex-row items-center gap-3 shadow-xl elevation-8"
        style={{
          backgroundColor: colors.surfaceDim,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10
        }}>
        <View className="flex-row items-center gap-3">
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
          <AppText className="text-base font-medium leading-5" style={{ color: colors.onSurface }}>
            Please check your Wi-Fi.
          </AppText>
        </View>
      </Animated.View>
      </View>
    </SafeAreaView>
  );
}

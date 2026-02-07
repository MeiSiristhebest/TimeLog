import { Ionicons } from '@/components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeritageTheme } from '@/theme/heritage';
import { HeritageButton } from '../heritage/HeritageButton';
import { checkNetworkOnline } from '@/features/shared/services/networkService';
import { AppText } from '@/components/ui/AppText';
import React from 'react';
import { View } from 'react-native';

interface OfflineScreenProps {
  onRetry?: () => void;
}

export function OfflineScreen({ onRetry }: OfflineScreenProps): JSX.Element {
  const { colors } = useHeritageTheme();

  const handleRetry = async () => {
    const isOnline = await checkNetworkOnline();
    if (isOnline && onRetry) {
      onRetry();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <View className="flex-1 items-center justify-center">
        <View className="w-full max-w-[420px] px-6 items-center gap-8">
        {/* Icon Section */}
        <View className="items-center justify-center">
          <View className="h-40 w-40 items-center justify-center rounded-full" style={{ backgroundColor: `${colors.error}15` }}>
            <Ionicons name="cloud-offline" size={80} color={colors.error} />
          </View>
        </View>

        <View className="items-center gap-3">
          <AppText className="text-4xl font-bold tracking-tighter" style={{ fontFamily: 'Fraunces_600SemiBold', color: colors.onSurface }}>No connection</AppText>
          <AppText className="text-lg text-center leading-7 max-w-xs" style={{ color: colors.textMuted }}>
            Your memories are safe, but we need the internet to upload them.
          </AppText>
        </View>

        {/* Action Button */}
        <View className="w-full max-w-[280px] mt-4">
          <HeritageButton
            title="Try Again"
            onPress={handleRetry}
            variant="outline"
            size="large"
            fullWidth
            style={{ borderColor: colors.primary }}
            textStyle={{ color: colors.primary, letterSpacing: 0.5, fontWeight: '700' }}
          />
        </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

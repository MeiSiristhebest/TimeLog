import { AppText } from '@/components/ui/AppText';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Animated } from '@/tw/animated';
import { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Container } from '@/components/ui/Container';
import { useHeritageTheme } from '@/theme/heritage';
import { APP_ROUTES } from '@/features/app/navigation/routes';

// Assets
const BRAND_LOGO = require('../../../../assets/images/brand_logo.png');

export default function AppEntryScreen() {
  const { colors } = useHeritageTheme();

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = () => {
      if (!isCancelled) {
        router.replace(APP_ROUTES.SPLASH);
      }
    };

    bootstrap();
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <Container>
      <View
        className="flex-1 items-center justify-center gap-6"
        style={{ backgroundColor: colors.surfaceDim }}>
        <Animated.View
          entering={ZoomIn.duration(1000)}
          className="shadow-xl"
          style={{ elevation: 5 }}>
          <Image
            source={BRAND_LOGO}
            className="w-[120px] h-[120px]"
            contentFit="contain"
            transition={500}
          />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(500).duration(1000)}>
          <AppText
            className="font-serif text-[32px] -tracking-[0.5px] font-bold"
            style={{ color: colors.primary }}>
            TimeLog
          </AppText>
        </Animated.View>
      </View>
    </Container>
  );
}


import { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DeviceCodeResult, generateDeviceCode } from '@/features/auth/services/deviceCodesService';
import { getStoredRole } from '@/features/auth/services/roleStorage';
import { HeritageAlert } from '@/components/ui/HeritageAlert';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import { PALETTE } from '@/theme/heritage';

export default function DeviceCodeScreen() {
  const [codeData, setCodeData] = useState<DeviceCodeResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { colors } = useHeritageTheme();

  // Redirect if not storyteller
  useEffect(() => {
    getStoredRole().then((role) => {
      if (role !== 'storyteller') {
        router.replace('/role');
      }
    });
  }, [router]);

  const loadCode = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await generateDeviceCode();
      setCodeData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to generate code right now.';
      setError(message);
      HeritageAlert.show({ title: 'Error', message, variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCode();
  }, [loadCode]);

  const handleReady = () => {
    router.replace('/(tabs)');
  };

  const formattedCode = codeData ? {
    part1: codeData.code.substring(0, 3),
    part2: codeData.code.substring(3, 6)
  } : { part1: '...', part2: '...' };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeritageHeader
        title="Connect Device"
        showBack
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/role');
        }}
      />

      {/* Main Content */}
      <View style={styles.main}>
        {/* Icon Anchor */}
        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
          <Ionicons name="phone-portrait-sharp" size={40} color={colors.primary} />
        </View>

        {/* Headline */}
        <Animated.Text
          entering={FadeInDown.duration(600).delay(200)}
          style={[styles.headline, { color: colors.onSurface }]}
        >
          Connect with{'\n'}Family
        </Animated.Text>

        {/* Code Container */}
        <Animated.View
          entering={ZoomIn.duration(600).delay(400)}
          style={[styles.codeContainer, { backgroundColor: colors.surfaceDim, borderColor: colors.border }]}
        >
          <Text style={[styles.codeLabel, { color: colors.textMuted }]}>YOUR CODE</Text>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : error ? (
            <Text style={{ color: colors.error, fontSize: 16 }}>Error generating code</Text>
          ) : (
            <View style={styles.codeTextContainer}>
              <Text style={[styles.codeDigit, { color: colors.onSurface }]}>{formattedCode.part1}</Text>
              <Text style={[styles.codeSeparator, { color: `${colors.primary}80` }]}>-</Text>
              <Text style={[styles.codeDigit, { color: colors.onSurface }]}>{formattedCode.part2}</Text>
            </View>
          )}
        </Animated.View>

        {/* Helper Text */}
        <Text style={[styles.helperText, { color: `${colors.onSurface}CC` }]}>
          Share this code with your family.
        </Text>
      </View>

      {/* Bottom Action Area */}
      <View style={styles.footer}>
        {/* Primary Action Button */}
        <HeritageButton
          title="I'm Ready"
          onPress={handleReady}
          variant="primary"
          size="large"
          iconRight="arrow-forward"
          fullWidth
          style={styles.readyButton}
        />

        <TouchableOpacity style={styles.troubleLink} onPress={() => loadCode()}>
          <Text style={[styles.troubleText, { color: colors.textMuted }]}>
            {loading ? 'Generating...' : 'Regenerate Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    width: '100%',
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  main: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  iconContainer: {
    padding: 16,
    borderRadius: 9999,
    marginBottom: 32,
  },
  headline: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 36,
    lineHeight: 43.2, // 1.2
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  codeContainer: {
    width: '100%',
    borderRadius: 12,
    padding: 32,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: PALETTE.shadowNeutral,
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  codeLabel: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 2, // tracking-widest
    fontWeight: '700',
    marginBottom: 16,
  },
  codeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // sm:gap-4 equivalent
  },
  codeDigit: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), // Monospace
    fontSize: 42, // sm:text-[56px] might be too big for some screens, stick to safe large
    fontWeight: '700',
    letterSpacing: 2,
  },
  codeSeparator: {
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
    fontSize: 42,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 22,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 28, // snug
  },
  footer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 24,
  },
  readyButton: {
    width: '100%',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  troubleLink: {
    width: '100%',
    marginTop: 24,
    alignItems: 'center',
  },
  troubleText: {
    fontSize: 14,
    fontWeight: '500',
  }
});

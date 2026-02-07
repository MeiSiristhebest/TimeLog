import { AppText } from '@/components/ui/AppText';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme, PALETTE } from '@/theme/heritage';
import { generateDeviceCode } from '@/features/auth/services/deviceCodesService';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export function DeviceCodeScreen(): JSX.Element {
  const { colors, typography } = useHeritageTheme();
  const scale = typography.body / 24;
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCode = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateDeviceCode();
      setCode(result.code);
      setExpiresAt(result.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate code');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCode();
  }, [loadCode]);

  const formatted = code
    ? {
        part1: code.substring(0, 3),
        part2: code.substring(3, 6),
      }
    : { part1: '...', part2: '...' };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.surfaceDim }}>
      <HeritageHeader title="Device Code" showBack />

      <View className="flex-1 items-center px-6 pt-10">
        <AppText
          className="text-center mb-6"
          style={{ color: colors.textMuted, fontSize: Math.round(18 * scale) }}>
          Share this code with family to link devices.
        </AppText>

        <View
          className="w-full rounded-2xl border px-6 py-8 items-center"
          style={{
            backgroundColor: colors.surfaceCard,
            borderColor: colors.border,
            shadowColor: PALETTE.shadowNeutral,
            shadowOpacity: 0.05,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 1,
          }}>
          <AppText className="text-xs uppercase mb-3" style={{ color: colors.textMuted }}>
            Device Code
          </AppText>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : error ? (
            <AppText style={{ color: colors.error }}>{error}</AppText>
          ) : (
            <View className="flex-row items-center gap-4">
              <AppText
                style={{
                  fontFamily: 'monospace',
                  fontSize: Math.round(36 * scale),
                  color: colors.onSurface,
                }}>
                {formatted.part1}
              </AppText>
              <AppText
                style={{
                  fontFamily: 'monospace',
                  fontSize: Math.round(36 * scale),
                  color: colors.textMuted,
                }}>
                -
              </AppText>
              <AppText
                style={{
                  fontFamily: 'monospace',
                  fontSize: Math.round(36 * scale),
                  color: colors.onSurface,
                }}>
                {formatted.part2}
              </AppText>
            </View>
          )}
          {expiresAt ? (
            <AppText className="text-xs mt-4" style={{ color: colors.textMuted }}>
              Expires {new Date(expiresAt).toLocaleTimeString()}
            </AppText>
          ) : null}
        </View>
      </View>

      <View className="px-6 pb-10">
        <HeritageButton
          title={loading ? 'Generating...' : 'Generate New Code'}
          onPress={loadCode}
          variant="primary"
          fullWidth
          disabled={loading}
        />
      </View>
    </View>
  );
}

import { AppText } from '@/components/ui/AppText';
import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import type { DeviceSummary } from '@/features/auth/services/deviceCodesService';
import { useDeviceManagementLogic } from '@/features/auth/hooks/useAuthLogic';
import { AUTH_STRINGS } from '@/features/auth/data/mockAuthData';

export default function DeviceManagementScreen(): JSX.Element {
  const theme = useHeritageTheme();

  // Logic Separation
  const { state, actions } = useDeviceManagementLogic();
  const { status, code, expiresAt, devices, error } = state;
  const { handleGenerate, handleRevoke } = actions;
  const STRINGS = AUTH_STRINGS.deviceManagement;

  const renderDeviceItem = useCallback(
    ({ item }: { item: DeviceSummary }) => {
      const isRevoked = !!item.revokedAt;
      return (
        <View
          style={{
            gap: 8,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: `${theme.colors.onSurface}10`,
            padding: 12,
            backgroundColor: isRevoked ? `${theme.colors.onSurface}05` : 'transparent',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <AppText style={{ fontSize: 16, fontWeight: '600', color: theme.colors.onSurface }}>
              {item.deviceName ?? 'Unnamed device'}
            </AppText>
            <AppText
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: isRevoked ? theme.colors.textMuted : theme.colors.success,
                textTransform: 'uppercase',
              }}>
              {isRevoked ? 'Revoked' : 'Active'}
            </AppText>
          </View>

          <View>
            <AppText style={{ fontSize: 12, color: `${theme.colors.onSurface}70` }}>
              Created: {new Date(item.createdAt).toLocaleDateString()}
            </AppText>
            <AppText style={{ fontSize: 12, color: `${theme.colors.onSurface}70` }}>
              Last seen: {item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleString() : '—'}
            </AppText>
          </View>

          {!isRevoked && (
            <HeritageButton
              title={STRINGS.revokeButton}
              onPress={() => handleRevoke(item.id)}
              variant="secondary"
              size="small"
              style={{ marginTop: 8 }}
            />
          )}
        </View>
      );
    },
    [handleRevoke, theme.colors, STRINGS.revokeButton]
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader title={STRINGS.title} showBack />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDeviceItem}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 16, gap: 16 }}
        ListHeaderComponent={
          <View style={{ gap: 24 }}>
            <View style={{ gap: 12 }}>
              <AppText
                style={{
                  fontSize: 24,
                  fontFamily: 'Fraunces_600SemiBold',
                  color: theme.colors.onSurface,
                }}>
                {STRINGS.header.title}
              </AppText>
              <AppText
                style={{ fontSize: 16, color: `${theme.colors.onSurface}80`, lineHeight: 24 }}>
                {STRINGS.header.subtitle}
              </AppText>
            </View>

            {/* Generate Section */}
            <View
              style={{
                borderRadius: 16,
                backgroundColor: theme.colors.surface,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
                gap: 16,
              }}>
              <AppText
                style={{
                  fontSize: 18,
                  fontFamily: 'Fraunces_600SemiBold',
                  color: theme.colors.onSurface,
                }}>
                {STRINGS.generateBox.title}
              </AppText>

              {code ? (
                <View style={{ alignItems: 'flex-start', gap: 4 }}>
                  <AppText
                    style={{
                      fontSize: 32,
                      fontFamily: 'System',
                      fontWeight: '700',
                      color: theme.colors.primary,
                      letterSpacing: 2,
                    }}>
                    {code}
                  </AppText>
                  <AppText style={{ fontSize: 14, color: `${theme.colors.onSurface}60` }}>
                    {STRINGS.generateBox.expires.replace(
                      '{time}',
                      expiresAt ? new Date(expiresAt).toLocaleTimeString() : '-'
                    )}
                  </AppText>
                </View>
              ) : null}

              {error ? (
                <AppText style={{ color: theme.colors.error, fontSize: 14 }}>{error}</AppText>
              ) : null}

              <HeritageButton
                title={
                  status === 'loading'
                    ? STRINGS.generateBox.button.loading
                    : STRINGS.generateBox.button.idle
                }
                onPress={handleGenerate}
                disabled={status === 'loading'}
                variant="primary"
              />
            </View>

            <AppText
              style={{
                fontSize: 18,
                fontFamily: 'Fraunces_600SemiBold',
                color: theme.colors.onSurface,
              }}>
              {STRINGS.linkedDevices}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <AppText style={{ color: `${theme.colors.onSurface}60`, fontStyle: 'italic' }}>
            {STRINGS.emptyList}
          </AppText>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

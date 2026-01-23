import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { HeritageButton } from '@/components/ui/heritage/HeritageButton';
import { HeritageHeader } from '@/components/ui/heritage/HeritageHeader';
import { useHeritageTheme } from '@/theme/heritage';
import {
  DeviceSummary,
  generateDeviceCode,
  listFamilyDevices,
  revokeDevice,
} from '@/features/auth/services/deviceCodesService';
import { HeritageAlert } from '@/components/ui/HeritageAlert';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function DeviceManagementScreen() {
  const theme = useHeritageTheme();
  const [status, setStatus] = useState<Status>('idle');
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [error, setError] = useState<string>('');

  const loadDevices = useCallback(async () => {
    try {
      const list = await listFamilyDevices();
      setDevices(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load devices.';
      setError(message);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleGenerate = async () => {
    setStatus('loading');
    setError('');
    try {
      const result = await generateDeviceCode();
      setCode(result.code);
      setExpiresAt(result.expiresAt);
      setStatus('success');
      HeritageAlert.show({
        title: 'Code Ready!',
        message: `Your device code is ${result.code}\n\nExpires at ${new Date(result.expiresAt).toLocaleTimeString()}`,
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to generate code.';
      setStatus('error');
      setError(message);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeDevice(id);
      await loadDevices();
      HeritageAlert.show({
        title: 'Device Revoked',
        message: 'Device will be logged out on next sync.',
        variant: 'success',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to revoke device.';
      HeritageAlert.show({
        title: 'Error',
        message: message,
        variant: 'error',
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <HeritageHeader title="Device Management" showBack />

      <ScrollView
        contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 16 }}
        style={{ flex: 1 }}
      >
        <View style={{ gap: 24 }}>
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 24, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.onSurface }}>
              Device Management
            </Text>
            <Text style={{ fontSize: 16, color: `${theme.colors.onSurface}80`, lineHeight: 24 }}>
              Generate a 6-digit code to link a senior device. Revocation applies on next heartbeat check.
            </Text>
          </View>

          {/* Generate Section */}
          <View style={{
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
            gap: 16
          }}>
            <Text style={{ fontSize: 18, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.onSurface }}>
              Generate device code
            </Text>

            {code ? (
              <View style={{ alignItems: 'flex-start', gap: 4 }}>
                <Text style={{ fontSize: 32, fontFamily: 'System', fontWeight: '700', color: theme.colors.primary, letterSpacing: 2 }}>
                  {code}
                </Text>
                <Text style={{ fontSize: 14, color: `${theme.colors.onSurface}60` }}>
                  Expires: {expiresAt ? new Date(expiresAt).toLocaleTimeString() : '-'}
                </Text>
              </View>
            ) : null}

            {error ? (
              <Text style={{ color: theme.colors.error, fontSize: 14 }}>{error}</Text>
            ) : null}

            <HeritageButton
              title={status === 'loading' ? 'Generating…' : 'Generate code'}
              onPress={handleGenerate}
              disabled={status === 'loading'}
              variant="primary"
            />
          </View>

          {/* Linked Devices Section */}
          <View style={{
            borderRadius: 16,
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: 16
          }}>
            <Text style={{ fontSize: 18, fontFamily: 'Fraunces_600SemiBold', color: theme.colors.onSurface }}>
              Linked devices
            </Text>

            {devices.length === 0 ? (
              <Text style={{ color: `${theme.colors.onSurface}60`, fontStyle: 'italic' }}>
                No devices yet.
              </Text>
            ) : (
              devices.map((device) => {
                const isRevoked = !!device.revokedAt;
                return (
                  <View
                    key={device.id}
                    style={{
                      gap: 8,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: `${theme.colors.onSurface}10`,
                      padding: 12,
                      backgroundColor: isRevoked ? `${theme.colors.onSurface}05` : 'transparent'
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.onSurface }}>
                        {device.deviceName ?? 'Unnamed device'}
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isRevoked ? theme.colors.textMuted : theme.colors.success,
                        textTransform: 'uppercase'
                      }}>
                        {isRevoked ? 'Revoked' : 'Active'}
                      </Text>
                    </View>

                    <View>
                      <Text style={{ fontSize: 12, color: `${theme.colors.onSurface}70` }}>
                        Created: {new Date(device.createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={{ fontSize: 12, color: `${theme.colors.onSurface}70` }}>
                        Last seen: {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : '—'}
                      </Text>
                    </View>

                    {!isRevoked && (
                      <HeritageButton
                        title="Revoke Access"
                        onPress={() => handleRevoke(device.id)}
                        variant="secondary"
                        size="small"
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

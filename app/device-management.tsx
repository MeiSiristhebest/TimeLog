import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import {
  DeviceSummary,
  generateDeviceCode,
  listFamilyDevices,
  revokeDevice,
} from '@/features/auth/services/deviceCodesService';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function DeviceManagementScreen() {
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
      Alert.alert(
        'Device code generated',
        `Code: ${result.code}\nExpires at: ${new Date(result.expiresAt).toLocaleTimeString()}`
      );
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
      Alert.alert('Revoked', 'Device will be logged out on next check.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to revoke device.';
      Alert.alert('Error', message);
    }
  };

  return (
    <Container>
      <ScrollView
        contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 16 }}
        className="gap-6">
        <View className="gap-3">
          <Text className="text-headline font-bold text-onSurface">Device Management</Text>
          <Text className="text-body text-onSurface">
            Generate a 6-digit code (15 min TTL, 5/hour) to link a senior device. Revocation applies
            on next heartbeat/access check.
          </Text>
        </View>

        <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="text-body font-semibold text-onSurface">Generate device code</Text>
          {code ? (
            <View className="items-start gap-1">
              <Text className="text-headline font-bold text-primary">Code: {code}</Text>
              <Text className="text-body text-onSurface/80">
                Expires: {expiresAt ? new Date(expiresAt).toLocaleString() : '-'}
              </Text>
            </View>
          ) : null}
          {error ? <Text className="text-body text-error">{error}</Text> : null}
          <Button
            title={status === 'loading' ? 'Generating…' : 'Generate code'}
            onPress={handleGenerate}
            disabled={status === 'loading'}
          />
        </View>

        <View className="gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <Text className="text-body font-semibold text-onSurface">Linked devices</Text>
          {devices.length === 0 ? (
            <Text className="text-body text-onSurface/80">No devices yet.</Text>
          ) : (
            devices.map((device) => {
              const isRevoked = !!device.revokedAt;
              return (
                <View key={device.id} className="gap-1 rounded-xl border border-onSurface/10 p-3">
                  <Text className="text-body font-semibold text-onSurface">
                    {device.deviceName ?? 'Unnamed device'}
                  </Text>
                  <Text className="text-body text-onSurface/70">
                    Created: {new Date(device.createdAt).toLocaleString()}
                  </Text>
                  <Text className="text-body text-onSurface/70">
                    Last seen:{' '}
                    {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : '—'}
                  </Text>
                  <Text className="text-body text-onSurface/70">
                    Status: {isRevoked ? 'Revoked (takes effect on next check)' : 'Active'}
                  </Text>
                  {!isRevoked ? (
                    <Button title="Revoke device" onPress={() => handleRevoke(device.id)} />
                  ) : (
                    <Text className="text-body text-success">Revoked</Text>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </Container>
  );
}

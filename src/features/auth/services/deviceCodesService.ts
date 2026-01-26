import { supabase } from '@/lib/supabase';
import { checkDeviceCodeRateLimit, recordDeviceCodeAttempt } from './deviceCodeRateLimiter';

export type DeviceCodeResult = {
  code: string;
  expiresAt: string;
};

type RpcDeviceRow = {
  id: string;
  device_name?: string | null;
  created_at: string;
  last_seen_at?: string | null;
  revoked_at?: string | null;
};

export type DeviceSummary = {
  id: string;
  deviceName: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
};

export async function generateDeviceCode(): Promise<DeviceCodeResult> {
  await checkDeviceCodeRateLimit('device-code-global');

  const { data, error } = await supabase.rpc('generate_device_code');
  if (error) {
    if (error.message.includes('rate_limit_exceeded')) {
      throw new Error('You have reached the hourly limit. Please try again later.');
    }
    throw new Error(error.message);
  }

  recordDeviceCodeAttempt('device-code-global');

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.code || !row?.expires_at) {
    throw new Error('Unable to generate a device code right now.');
  }

  return {
    code: row.code,
    expiresAt: row.expires_at,
  };
}

export async function listFamilyDevices(): Promise<DeviceSummary[]> {
  const { data, error } = await supabase.rpc('list_family_devices');
  if (error) {
    throw new Error(error.message);
  }

  return ((data as RpcDeviceRow[] | null | undefined) ?? []).map((row) => ({
    id: row.id,
    deviceName: row.device_name ?? null,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at ?? null,
    revokedAt: row.revoked_at ?? null,
  }));
}

export async function revokeDevice(deviceId: string): Promise<void> {
  if (!deviceId) {
    throw new Error('Missing device id.');
  }

  const { error } = await supabase.rpc('revoke_device', { p_device_id: deviceId });
  if (error) {
    throw new Error(error.message);
  }
}

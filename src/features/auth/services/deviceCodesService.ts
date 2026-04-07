import { supabase } from '@/lib/supabase';
import { checkDeviceCodeRateLimit, recordDeviceCodeAttempt } from './deviceCodeRateLimiter';
import {
  getStoredDeviceCode,
  setStoredDeviceCode,
} from './deviceCodeStorage';
import { devLog } from '@/lib/devLogger';

/**
 * Utility to map device code RPC errors to user-friendly messages.
 */
function mapDeviceCodeError(error: any): string {
  if (!error) return 'An unknown error occurred.';
  const message = error.message || '';

  if (message.includes('rate_limit_exceeded')) {
    return 'You have reached the limit for generating codes. Please try again in an hour.';
  }
  if (message.includes('function generate_device_code() does not exist')) {
    return 'Device sign-in is temporarily unavailable. Please try again later.';
  }
  if (message.includes('Policy check failed') || message.includes('permission denied')) {
    return 'You do not have permission to manage family devices.';
  }
  if (message.includes('invalid input syntax for type uuid')) {
    return 'Invalid device identifier provided.';
  }

  return 'A connection error occurred while managing devices. Please try again.';
}

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
  // 1. Check local storage first
  const stored = getStoredDeviceCode();
  if (stored) {
    return stored;
  }

  // 2. Rate limit check
  await checkDeviceCodeRateLimit('device-code-global');

  // 3. Generate new code via RPC
  const { data, error } = await supabase.rpc('generate_device_code');
  if (error) {
    devLog.error('[deviceCodesService] Failed to generate device code:', error);
    throw new Error(mapDeviceCodeError(error));
  }

  recordDeviceCodeAttempt('device-code-global');

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.code || !row?.expires_at) {
    throw new Error('Unable to generate a device code right now.');
  }

  const result = {
    code: row.code,
    expiresAt: row.expires_at,
  };

  // 4. Persist new code
  setStoredDeviceCode(result);

  return result;
}

export async function listFamilyDevices(): Promise<DeviceSummary[]> {
  const { data, error } = await supabase.rpc('list_family_devices');
  if (error) {
    devLog.error('[deviceCodesService] Failed to list devices:', error);
    throw new Error(mapDeviceCodeError(error));
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
    devLog.error('[deviceCodesService] Failed to revoke device:', error);
    throw new Error(mapDeviceCodeError(error));
  }
}

import { mmkv } from '@/lib/mmkv';
import { DeviceCodeResult } from './deviceCodesService';

const DEVICE_CODE_KEY = 'timelog.device_code';
const DEVICE_CODE_EXPIRY_KEY = 'timelog.device_code_expiry';

export function getStoredDeviceCode(): DeviceCodeResult | null {
    try {
        const code = mmkv.getString(DEVICE_CODE_KEY);
        const expiresAt = mmkv.getString(DEVICE_CODE_EXPIRY_KEY);

        if (code && expiresAt) {
            // Check if expired
            if (new Date(expiresAt) > new Date()) {
                return { code, expiresAt };
            } else {
                // Clear expired code
                clearStoredDeviceCode();
            }
        }
        return null;
    } catch {
        return null;
    }
}

export function setStoredDeviceCode(data: DeviceCodeResult): void {
    try {
        mmkv.set(DEVICE_CODE_KEY, data.code);
        mmkv.set(DEVICE_CODE_EXPIRY_KEY, data.expiresAt);
    } catch {
        // ignore
    }
}

export function clearStoredDeviceCode(): void {
    try {
        mmkv.delete(DEVICE_CODE_KEY);
        mmkv.delete(DEVICE_CODE_EXPIRY_KEY);
    } catch {
        // ignore
    }
}

import { generateDeviceCode, listFamilyDevices, revokeDevice } from './deviceCodesService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

describe('deviceCodesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDeviceCode', () => {
    it('should return code and expiresAt on success', async () => {
      const mockResponse = {
        code: 'ABC123',
        expires_at: '2026-01-17T00:00:00Z',
      };
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await generateDeviceCode();

      expect(supabase.rpc).toHaveBeenCalledWith('generate_device_code');
      expect(result).toEqual({
        code: 'ABC123',
        expiresAt: '2026-01-17T00:00:00Z',
      });
    });

    it('should handle array response from RPC', async () => {
      const mockResponse = [
        {
          code: 'XYZ789',
          expires_at: '2026-01-18T00:00:00Z',
        },
      ];
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await generateDeviceCode();

      expect(result).toEqual({
        code: 'XYZ789',
        expiresAt: '2026-01-18T00:00:00Z',
      });
    });

    it('should throw rate limit error when exceeded', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'rate_limit_exceeded: too many requests' },
      });

      await expect(generateDeviceCode()).rejects.toThrow(
        'You have reached the hourly limit. Please try again later.'
      );
    });

    it('should throw generic error on API failure', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(generateDeviceCode()).rejects.toThrow('Database connection failed');
    });

    it('should throw error when response is missing code', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: { expires_at: '2026-01-17T00:00:00Z' },
        error: null,
      });

      await expect(generateDeviceCode()).rejects.toThrow(
        'Unable to generate a device code right now.'
      );
    });

    it('should throw error when response is missing expires_at', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: { code: 'ABC123' },
        error: null,
      });

      await expect(generateDeviceCode()).rejects.toThrow(
        'Unable to generate a device code right now.'
      );
    });

    it('should throw error when response is null', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(generateDeviceCode()).rejects.toThrow(
        'Unable to generate a device code right now.'
      );
    });

    it('should throw error when response array is empty', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: [],
        error: null,
      });

      await expect(generateDeviceCode()).rejects.toThrow(
        'Unable to generate a device code right now.'
      );
    });
  });

  describe('listFamilyDevices', () => {
    it('should return mapped device list on success', async () => {
      const mockDevices = [
        {
          id: 'device-1',
          device_name: 'iPhone 14',
          created_at: '2026-01-01T00:00:00Z',
          last_seen_at: '2026-01-15T00:00:00Z',
          revoked_at: null,
        },
        {
          id: 'device-2',
          device_name: null,
          created_at: '2026-01-10T00:00:00Z',
          last_seen_at: null,
          revoked_at: '2026-01-12T00:00:00Z',
        },
      ];
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: mockDevices,
        error: null,
      });

      const result = await listFamilyDevices();

      expect(supabase.rpc).toHaveBeenCalledWith('list_family_devices');
      expect(result).toEqual([
        {
          id: 'device-1',
          deviceName: 'iPhone 14',
          createdAt: '2026-01-01T00:00:00Z',
          lastSeenAt: '2026-01-15T00:00:00Z',
          revokedAt: null,
        },
        {
          id: 'device-2',
          deviceName: null,
          createdAt: '2026-01-10T00:00:00Z',
          lastSeenAt: null,
          revokedAt: '2026-01-12T00:00:00Z',
        },
      ]);
    });

    it('should return empty array when data is null', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await listFamilyDevices();

      expect(result).toEqual([]);
    });

    it('should return empty array when data is undefined', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: undefined,
        error: null,
      });

      const result = await listFamilyDevices();

      expect(result).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Unauthorized access' },
      });

      await expect(listFamilyDevices()).rejects.toThrow('Unauthorized access');
    });
  });

  describe('revokeDevice', () => {
    it('should call RPC with correct device ID', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        error: null,
      });

      await revokeDevice('device-123');

      expect(supabase.rpc).toHaveBeenCalledWith('revoke_device', {
        p_device_id: 'device-123',
      });
    });

    it('should throw error when deviceId is empty', async () => {
      await expect(revokeDevice('')).rejects.toThrow('Missing device id.');
    });

    it('should throw error on API failure', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        error: { message: 'Device not found' },
      });

      await expect(revokeDevice('invalid-device')).rejects.toThrow('Device not found');
    });

    it('should succeed silently on success', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValue({
        error: null,
      });

      await expect(revokeDevice('device-456')).resolves.toBeUndefined();
    });
  });
});

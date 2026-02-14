import { NetworkQualityService } from './NetworkQualityService';

const mockInvoke = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

describe('NetworkQualityService offline sliding window', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-10T00:00:00.000Z'));
    mockInvoke.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('transitions to OFFLINE only after 3 failed probes inside 2 seconds', async () => {
    const service = new NetworkQualityService();
    const qualityEvents: string[] = [];

    service.onQualityChange((metrics) => {
      qualityEvents.push(metrics.quality);
    });

    mockInvoke.mockRejectedValue(new Error('probe failed'));

    const probe = (service as unknown as { probe: () => Promise<void> }).probe;

    await probe.call(service);
    await probe.call(service);
    await probe.call(service);

    expect(qualityEvents).toContain('OFFLINE');
    expect(qualityEvents[qualityEvents.length - 1]).toBe('OFFLINE');
  });

  it('does not transition to OFFLINE when failures are outside the 2-second window', async () => {
    const service = new NetworkQualityService();
    const qualityEvents: string[] = [];

    service.onQualityChange((metrics) => {
      qualityEvents.push(metrics.quality);
    });

    mockInvoke.mockRejectedValue(new Error('probe failed'));

    const probe = (service as unknown as { probe: () => Promise<void> }).probe;

    await probe.call(service);
    jest.advanceTimersByTime(1200);
    await probe.call(service);
    jest.advanceTimersByTime(1200);
    await probe.call(service);

    expect(qualityEvents[qualityEvents.length - 1]).not.toBe('OFFLINE');
  });
});

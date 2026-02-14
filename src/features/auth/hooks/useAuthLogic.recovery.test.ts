import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useRecoveryCodeLogic } from './useAuthLogic';

const mockGetActiveRecoveryCode = jest.fn();
const mockGenerateRecoveryCode = jest.fn();
const mockAlertShow = jest.fn();

jest.mock('../services/recoveryCodeService', () => ({
  getActiveRecoveryCode: (...args: unknown[]) => mockGetActiveRecoveryCode(...args),
  generateRecoveryCode: (...args: unknown[]) => mockGenerateRecoveryCode(...args),
}));

jest.mock('@/components/ui/HeritageAlert', () => ({
  HeritageAlert: {
    show: (...args: unknown[]) => mockAlertShow(...args),
  },
}));

describe('useRecoveryCodeLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads active recovery code on mount', async () => {
    mockGetActiveRecoveryCode.mockResolvedValue({
      code: 'RCV-111-222',
    });

    const { result } = renderHook(() => useRecoveryCodeLogic());

    await waitFor(() => {
      expect(result.current.state.isLoadingCode).toBe(false);
    });

    expect(result.current.state.recoveryCode).toBe('RCV-111-222');
  });

  it('keeps empty state when active recovery code is missing', async () => {
    mockGetActiveRecoveryCode.mockResolvedValue(null);

    const { result } = renderHook(() => useRecoveryCodeLogic());

    await waitFor(() => {
      expect(result.current.state.isLoadingCode).toBe(false);
    });

    expect(result.current.state.recoveryCode).toBeNull();
  });

  it('updates code when generation succeeds', async () => {
    mockGetActiveRecoveryCode.mockResolvedValue(null);
    mockGenerateRecoveryCode.mockResolvedValue({ code: 'RCV-333-444' });

    const { result } = renderHook(() => useRecoveryCodeLogic());

    await waitFor(() => {
      expect(result.current.state.isLoadingCode).toBe(false);
    });

    await act(async () => {
      await result.current.actions.handleGenerateCode();
    });

    const alertPayload = mockAlertShow.mock.calls[0]?.[0] as
      | { primaryAction?: { onPress?: () => Promise<void> | void } }
      | undefined;
    expect(alertPayload?.primaryAction?.onPress).toBeDefined();

    await act(async () => {
      await alertPayload?.primaryAction?.onPress?.();
    });

    expect(result.current.state.recoveryCode).toBe('RCV-333-444');
  });
});

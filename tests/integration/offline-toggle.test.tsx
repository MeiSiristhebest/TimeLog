import { act, render, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { OfflineBanner } from '@/components/ui/feedback/OfflineBanner';

jest.mock('@/components/ui/Icon', () => ({
  Ionicons: () => null,
}));

jest.mock('@react-native-community/netinfo', () => {
  let handler: ((state: { isConnected: boolean | null }) => void) | null = null;
  return {
    addEventListener: (cb: typeof handler) => {
      handler = cb;
      return () => {
        handler = null;
      };
    },
    __emit: (state: { isConnected: boolean | null }) => handler?.(state),
  };
});

describe('OfflineBanner', () => {
  it('shows banner when connection goes offline', async () => {
    const { queryByText } = render(<OfflineBanner />);

    // Simulate offline event
    act(() => {
      (NetInfo as any).__emit({ isConnected: false });
    });

    await waitFor(() => {
      expect(queryByText(/please check your wi-fi/i)).toBeTruthy();
    });
  });
});

/**
 * SyncStatusBadge.integration.test.tsx - Integration tests for sync status flow.
 *
 * Tests the complete sync flow from local → queued → syncing → synced.
 * Implements Task 5.2 and 5.3: Full sync flow and offline recovery tests.
 */

import { render, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { PALETTE } from '@/theme/heritage';
import { SyncStatusBadge } from './SyncStatusBadge';
import type { SyncStatus } from '@/types/entities';

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const mockReanimated = jest.requireActual('react-native-reanimated/mock');
  mockReanimated.default.call = () => {};
  return mockReanimated;
});

function getStatusLabel(status: SyncStatus): string {
  switch (status) {
    case 'local':
    case 'local_only':
      return 'Local Only';
    case 'queued':
      return 'Waiting for Network';
    case 'failed':
      return 'Sync Failed';
    default:
      return 'Saved to Cloud';
  }
}

describe('SyncStatusBadge Integration Tests', () => {
  describe('Task 5.2: Full Sync Flow', () => {
    it('transitions from local → queued → syncing → synced', async () => {
      const { rerender } = render(<SyncStatusBadge status="local" />);

      // Initial state: local
      expect(screen.getByText('Local Only')).toBeTruthy();
      expect(screen.getByLabelText('Local Only')).toBeTruthy();

      // Transition to queued (when network detected)
      rerender(<SyncStatusBadge status="queued" />);
      await waitFor(() => {
        expect(screen.getByText('Waiting for Network')).toBeTruthy();
      });

      // Transition to syncing (upload started)
      rerender(<SyncStatusBadge status="syncing" />);
      await waitFor(() => {
        expect(screen.getByText('Backing up...')).toBeTruthy();
      });

      // Transition to synced (upload complete)
      rerender(<SyncStatusBadge status="synced" />);
      await waitFor(() => {
        expect(screen.getByText('Saved to Cloud')).toBeTruthy();
      });
    });

    it('maintains accessibility announcements during full sync flow', async () => {
      const { rerender, getByLabelText } = render(<SyncStatusBadge status="local" />);

      // Each state should have proper accessibility label
      expect(getByLabelText('Local Only')).toBeTruthy();

      rerender(<SyncStatusBadge status="queued" />);
      await waitFor(() => {
        expect(getByLabelText('Waiting for Network')).toBeTruthy();
      });

      rerender(<SyncStatusBadge status="syncing" />);
      await waitFor(() => {
        expect(getByLabelText('Backing up...')).toBeTruthy();
      });

      rerender(<SyncStatusBadge status="synced" />);
      await waitFor(() => {
        expect(getByLabelText('Saved to Cloud')).toBeTruthy();
      });
    });

    it('shows correct colors during sync flow transitions', async () => {
      const { rerender, getByText } = render(<SyncStatusBadge status="local" />);

      // Amber for local
      expect(StyleSheet.flatten(getByText('Local Only').props.style).color).toBe(
        PALETTE.warning
      );

      // Amber for queued
      rerender(<SyncStatusBadge status="queued" />);
      await waitFor(() => {
        expect(StyleSheet.flatten(getByText('Waiting for Network').props.style).color).toBe(
          PALETTE.warning
        );
      });

      // Primary for syncing
      rerender(<SyncStatusBadge status="syncing" />);
      await waitFor(() => {
        expect(StyleSheet.flatten(getByText('Backing up...').props.style).color).toBe(
          PALETTE.primary
        );
      });

      // Success for synced
      rerender(<SyncStatusBadge status="synced" />);
      await waitFor(() => {
        expect(StyleSheet.flatten(getByText('Saved to Cloud').props.style).color).toBe(
          PALETTE.success
        );
      });
    });
  });

  describe('Task 5.3: Offline Recovery', () => {
    it('handles offline → online → sync transition', async () => {
      const { rerender } = render(<SyncStatusBadge status="local" />);

      // Offline: stays local
      expect(screen.getByText('Local Only')).toBeTruthy();

      // Network comes back: queued for upload
      rerender(<SyncStatusBadge status="queued" />);
      await waitFor(() => {
        expect(screen.getByText('Waiting for Network')).toBeTruthy();
      });

      // Auto-sync triggers: syncing
      rerender(<SyncStatusBadge status="syncing" />);
      await waitFor(() => {
        expect(screen.getByText('Backing up...')).toBeTruthy();
      });

      // Upload completes: synced
      rerender(<SyncStatusBadge status="synced" />);
      await waitFor(() => {
        expect(screen.getByText('Saved to Cloud')).toBeTruthy();
      });
    });

    it('handles failed upload with retry indication', async () => {
      const { rerender } = render(<SyncStatusBadge status="syncing" />);

      expect(screen.getByText('Backing up...')).toBeTruthy();

      // Upload fails: shows retry message
      rerender(<SyncStatusBadge status="failed" />);
      await waitFor(() => {
        expect(screen.getByText('Sync Failed')).toBeTruthy();
        expect(screen.getByLabelText('Sync Failed')).toBeTruthy();
      });

      // Uses humble language (amber, not red)
      const text = screen.getByText('Sync Failed');
      expect(StyleSheet.flatten(text.props.style).color).toBe(PALETTE.warning);
    });

    it('recovers from failed state to syncing on retry', async () => {
      const { rerender } = render(<SyncStatusBadge status="failed" />);

      expect(screen.getByText('Sync Failed')).toBeTruthy();

      // Retry attempt: back to syncing
      rerender(<SyncStatusBadge status="syncing" />);
      await waitFor(() => {
        expect(screen.getByText('Backing up...')).toBeTruthy();
      });

      // Success on retry
      rerender(<SyncStatusBadge status="synced" />);
      await waitFor(() => {
        expect(screen.getByText('Saved to Cloud')).toBeTruthy();
      });
    });
  });

  describe('UX Spec Compliance: "Honest Connectivity"', () => {
    it('uses humble language for errors (no blame)', () => {
      const { getByText } = render(<SyncStatusBadge status="failed" />);

      // Should say "Sync Failed" (try again later), not "Upload Error"
      expect(getByText('Sync Failed')).toBeTruthy();
    });

    it('distinguishes locally safe vs cloud backed states visually', () => {
      // Locally safe states: Amber
      const locallySafe: SyncStatus[] = ['local', 'local_only', 'queued', 'failed'];
      locallySafe.forEach((status) => {
        const { getByText, unmount } = render(<SyncStatusBadge status={status} />);
        const textElement = getByText(getStatusLabel(status));
        expect(StyleSheet.flatten(textElement.props.style).color).toBe(PALETTE.warning);
        unmount();
      });

      // Cloud backed: Green
      const { getByText } = render(<SyncStatusBadge status="synced" />);
      expect(StyleSheet.flatten(getByText('Saved to Cloud').props.style).color).toBe(
        PALETTE.success
      );
    });
  });
});

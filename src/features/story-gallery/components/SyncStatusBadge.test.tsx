/**
 * SyncStatusBadge.test.tsx - Unit tests for sync status badge component.
 *
 * Tests all 5 sync states with correct icons, colors, and accessibility.
 * Implements Task 5.1: Unit test component rendering for all 5 states
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SyncStatusBadge } from './SyncStatusBadge';
import type { SyncStatus } from '@/types/entities';

// Mock reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('SyncStatusBadge', () => {
  describe('State Rendering', () => {
    it('renders "local" state with amber cloud icon', () => {
      render(<SyncStatusBadge status="local" />);

      expect(screen.getByText('Saved Locally')).toBeTruthy();
      expect(screen.getByLabelText('Saved Locally')).toBeTruthy();
    });

    it('renders "queued" state with amber icon', () => {
      render(<SyncStatusBadge status="queued" />);

      expect(screen.getByText('Waiting for Network')).toBeTruthy();
      expect(screen.getByLabelText('Waiting for Network')).toBeTruthy();
    });

    it('renders "syncing" state with rotating icon', () => {
      render(<SyncStatusBadge status="syncing" />);

      expect(screen.getByText('Backing up...')).toBeTruthy();
      expect(screen.getByLabelText('Backing up...')).toBeTruthy();
    });

    it('renders "synced" state with green checkmark icon', () => {
      render(<SyncStatusBadge status="synced" />);

      expect(screen.getByText('Saved to Cloud')).toBeTruthy();
      expect(screen.getByLabelText('Saved to Cloud')).toBeTruthy();
    });

    it('renders "failed" state with amber alert icon', () => {
      render(<SyncStatusBadge status="failed" />);

      expect(screen.getByText('Sync Failed')).toBeTruthy();
      expect(screen.getByLabelText('Sync Failed')).toBeTruthy();
    });
  });

  describe('Color Validation', () => {
    it('uses amber color for "local" state', () => {
      const { getByText } = render(<SyncStatusBadge status="local" />);
      const text = getByText('Saved Locally');

      expect(text.props.style).toMatchObject({ color: '#D4A012' });
    });

    it('uses primary color for "syncing" state', () => {
      const { getByText } = render(<SyncStatusBadge status="syncing" />);
      const text = getByText('Backing up...');

      expect(text.props.style).toMatchObject({ color: '#C26B4A' });
    });

    it('uses success color for "synced" state', () => {
      const { getByText } = render(<SyncStatusBadge status="synced" />);
      const text = getByText('Saved to Cloud');

      expect(text.props.style).toMatchObject({ color: '#7D9D7A' });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibilityRole="text"', () => {
      const { getByLabelText } = render(<SyncStatusBadge status="synced" />);
      const badge = getByLabelText('Saved to Cloud');

      expect(badge.props.accessibilityRole).toBe('text');
    });

    it('has accessibilityLiveRegion="polite" for status changes', () => {
      const { getByLabelText } = render(<SyncStatusBadge status="syncing" />);
      const badge = getByLabelText('Backing up...');

      expect(badge.props.accessibilityLiveRegion).toBe('polite');
    });
  });

  describe('Customization', () => {
    it('applies custom className prop', () => {
      const { getByLabelText } = render(
        <SyncStatusBadge status="synced" className="mt-4" />
      );
      const badge = getByLabelText('Saved to Cloud');

      expect(badge.props.className).toContain('mt-4');
    });

    it('hides text when showText is false', () => {
      const { queryByText } = render(<SyncStatusBadge status="synced" showText={false} />);
      expect(queryByText('Saved to Cloud')).toBeNull();
    });
  });
});

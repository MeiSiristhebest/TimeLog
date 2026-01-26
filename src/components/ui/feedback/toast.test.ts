/**
 * Tests for toast service.
 * Story 3.6: Offline Access Strategy
 */

import { showToast, showOfflineUnavailableToast, registerToastListener } from './toast';

describe('toast service', () => {
  let mockListener: jest.Mock;
  let unregister: () => void;

  beforeEach(() => {
    mockListener = jest.fn();
    unregister = registerToastListener(mockListener);
  });

  afterEach(() => {
    unregister();
  });

  describe('showToast', () => {
    it('notifies the registered listener', () => {
      showToast({ message: 'Test message' });

      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test message',
        })
      );
    });

    it('passes options correctly', () => {
      showToast({ message: 'Test message', duration: 'long', type: 'success' });

      expect(mockListener).toHaveBeenCalledWith({
        message: 'Test message',
        duration: 'long',
        type: 'success',
      });
    });
  });

  describe('showOfflineUnavailableToast', () => {
    it('shows English offline message with warning type', () => {
      showOfflineUnavailableToast();

      expect(mockListener).toHaveBeenCalledWith({
        message: 'Please connect to the network to play',
        type: 'warning',
        duration: 'short',
      });
    });
  });
});

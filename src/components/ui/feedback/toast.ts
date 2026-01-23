/**
 * Non-blocking Toast service.
 * Replaces the native ToastAndroid/Alert implementation with an event-based system
 * that drives a custom UI component.
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: 'short' | 'long';
}

type ToastListener = (options: ToastOptions) => void;

let listener: ToastListener | null = null;

/**
 * Register a listener to handle toast events.
 * Used by the ToastProvider component.
 */
export function registerToastListener(fn: ToastListener) {
  listener = fn;
  return () => {
    listener = null;
  };
}

/**
 * Show a toast message to the user.
 * Emits an event to the global listener.
 *
 * @param options - Toast configuration
 */
export function showToast(options: ToastOptions): void {
  if (listener) {
    listener(options);
  } else {
    console.warn('showToast called but no listener registered. Wrap your app in ToastProvider.');
  }
}

/**
 * Show offline unavailable message.
 * Story 3.6: "Humble Helper" tone - no blame language.
 */
export function showOfflineUnavailableToast(): void {
  showToast({
    message: 'Please connect to the network to play',
    type: 'warning',
    duration: 'short',
  });
}

export function showSuccessToast(message: string): void {
  showToast({
    message,
    type: 'success',
    duration: 'short',
  });
}

/**
 * Show error message toast.
 * Used for user-facing error feedback.
 */
export function showErrorToast(message: string): void {
  showToast({
    message,
    type: 'error',
    duration: 'long',
  });
}

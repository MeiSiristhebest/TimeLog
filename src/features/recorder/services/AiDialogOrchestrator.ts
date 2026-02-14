/**
 * AI Dialog Orchestrator
 * 
 * Manages dialog session state machine with three modes:
 * - DIALOG: Full AI dialog mode (online, responsive)
 * - DEGRADED: Network quality poor or timeout hit
 * - SILENT: User skipped 2x or manually disabled AI
 * 
 * Key Rules:
 * - 2000ms AI response timeout
 * - 2x skip → transition to SILENT mode
 * - Local recording NEVER blocked by AI dialog state
 */

export type DialogMode = 'DIALOG' | 'DEGRADED' | 'SILENT';

export interface DialogState {
  mode: DialogMode;
  skipCount: number;
  timeoutCount: number;
  lastResponseTime: number | null;
  isWaitingForResponse: boolean;
}

export interface DialogModeChangeEvent {
  previousMode: DialogMode;
  newMode: DialogMode;
  reason: string;
  timestamp: number;
}

export interface DialogTimeoutEvent {
  timeoutCount: number;
  timestamp: number;
}

const AI_RESPONSE_TIMEOUT_MS = 2000;
const MAX_SKIPS_BEFORE_SILENT = 2;
const DEGRADED_TIMEOUT_THRESHOLD = 3; // 3 consecutive timeouts → DEGRADED

export class AiDialogOrchestrator {
  private state: DialogState = {
    mode: 'DIALOG',
    skipCount: 0,
    timeoutCount: 0,
    lastResponseTime: null,
    isWaitingForResponse: false,
  };

  private responseTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<(event: DialogModeChangeEvent) => void> = new Set();
  private timeoutListeners: Set<(event: DialogTimeoutEvent) => void> = new Set();

  /**
   * Start waiting for AI response
   */
  startWaitingForResponse(): void {
    this.state.isWaitingForResponse = true;

    // Clear existing timer
    if (this.responseTimer) {
      clearTimeout(this.responseTimer);
    }

    // Start timeout timer
    this.responseTimer = setTimeout(() => {
      this.handleTimeout();
    }, AI_RESPONSE_TIMEOUT_MS);
  }

  /**
   * Mark AI response received
   */
  handleAiResponse(): void {
    this.state.isWaitingForResponse = false;
    this.state.lastResponseTime = Date.now();
    this.state.skipCount = 0; // Reset skip count on successful response
    this.state.timeoutCount = 0; // Reset timeout count

    // Clear timeout timer
    if (this.responseTimer) {
      clearTimeout(this.responseTimer);
      this.responseTimer = null;
    }

    // If in DEGRADED mode and response is fast, transition back to DIALOG
    if (this.state.mode === 'DEGRADED') {
      this.transitionTo('DIALOG', 'AI response recovered');
    }
  }

  /**
   * Handle user skip action
   */
  handleSkip(): void {
    this.state.skipCount++;

    // Clear waiting state
    this.state.isWaitingForResponse = false;
    if (this.responseTimer) {
      clearTimeout(this.responseTimer);
      this.responseTimer = null;
    }

    // Check if skip threshold reached
    if (this.state.skipCount >= MAX_SKIPS_BEFORE_SILENT) {
      this.transitionTo('SILENT', `User skipped ${MAX_SKIPS_BEFORE_SILENT} times`);
    }
  }

  /**
   * Handle user continue action (re-enable dialog)
   */
  handleContinue(): void {
    if (this.state.mode === 'SILENT') {
      this.state.skipCount = 0;
      this.transitionTo('DIALOG', 'User requested to continue dialog');
    }
  }

  /**
   * Handle timeout (2000ms no response)
   */
  private handleTimeout(): void {
    this.state.isWaitingForResponse = false;
    this.state.timeoutCount++;

    const timeoutEvent: DialogTimeoutEvent = {
      timeoutCount: this.state.timeoutCount,
      timestamp: Date.now(),
    };

    this.timeoutListeners.forEach((listener) => {
      try {
        listener(timeoutEvent);
      } catch {
        // Silently ignore listener errors
      }
    });

    // Multiple consecutive timeouts → DEGRADED mode
    if (this.state.timeoutCount >= DEGRADED_TIMEOUT_THRESHOLD) {
      this.transitionTo('DEGRADED', `${DEGRADED_TIMEOUT_THRESHOLD} consecutive timeouts`);
    }
  }

  /**
   * Force transition to specific mode
   */
  setMode(mode: DialogMode, reason: string): void {
    this.transitionTo(mode, reason);
  }

  /**
   * Get current state
   */
  getState(): Readonly<DialogState> {
    return { ...this.state };
  }

  /**
   * Subscribe to mode changes
   */
  onModeChange(callback: (event: DialogModeChangeEvent) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Subscribe to AI timeout events (2000ms no response)
   */
  onTimeout(callback: (event: DialogTimeoutEvent) => void): () => void {
    this.timeoutListeners.add(callback);

    return () => {
      this.timeoutListeners.delete(callback);
    };
  }

  /**
   * Transition to new mode
   */
  private transitionTo(newMode: DialogMode, reason: string): void {
    const previousMode = this.state.mode;

    if (previousMode === newMode) {
      return; // No change
    }

    this.state.mode = newMode;

    // Emit mode change event
    const event: DialogModeChangeEvent = {
      previousMode,
      newMode,
      reason,
      timestamp: Date.now(),
    };

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Silently ignore listener errors
      }
    });
  }

  /**
   * Reset state (e.g., for new recording session)
   */
  reset(): void {
    if (this.responseTimer) {
      clearTimeout(this.responseTimer);
      this.responseTimer = null;
    }

    this.state = {
      mode: 'DIALOG',
      skipCount: 0,
      timeoutCount: 0,
      lastResponseTime: null,
      isWaitingForResponse: false,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.responseTimer) {
      clearTimeout(this.responseTimer);
      this.responseTimer = null;
    }
    this.listeners.clear();
    this.timeoutListeners.clear();
  }
}

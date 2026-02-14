import { AiDialogOrchestrator } from './AiDialogOrchestrator';

describe('AiDialogOrchestrator timeout policy', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('transitions to DEGRADED after three consecutive 2000ms timeouts', () => {
    const orchestrator = new AiDialogOrchestrator();
    const modeChanges: string[] = [];

    orchestrator.onModeChange((event) => {
      modeChanges.push(event.newMode);
    });

    orchestrator.startWaitingForResponse();
    jest.advanceTimersByTime(2000);
    expect(orchestrator.getState().mode).toBe('DIALOG');

    orchestrator.startWaitingForResponse();
    jest.advanceTimersByTime(2000);
    expect(orchestrator.getState().mode).toBe('DIALOG');

    orchestrator.startWaitingForResponse();
    jest.advanceTimersByTime(2000);
    expect(orchestrator.getState().mode).toBe('DEGRADED');
    expect(modeChanges).toContain('DEGRADED');
  });

  it('resets timeout count after ai response', () => {
    const orchestrator = new AiDialogOrchestrator();

    orchestrator.startWaitingForResponse();
    jest.advanceTimersByTime(2000);
    expect(orchestrator.getState().timeoutCount).toBe(1);

    orchestrator.handleAiResponse();
    expect(orchestrator.getState().timeoutCount).toBe(0);
    expect(orchestrator.getState().mode).toBe('DIALOG');
  });
});

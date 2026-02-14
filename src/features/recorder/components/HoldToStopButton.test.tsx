import { act, fireEvent, render } from '@testing-library/react-native';
import { HoldToStopButton } from './HoldToStopButton';

jest.mock('@/components/ui/Icon', () => ({
  Ionicons: () => null,
}));

jest.mock('react-native-svg', () => {
  const React = require('react');
  const MockSvg = ({ children }: { children?: React.ReactNode }) => (
    <>{React.Children.toArray(children)}</>
  );
  return {
    __esModule: true,
    default: MockSvg,
    Circle: MockSvg,
  };
});

describe('HoldToStopButton', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('triggers onHoldComplete after hold duration', () => {
    const onHoldComplete = jest.fn();
    const { getByLabelText } = render(
      <HoldToStopButton
        onHoldComplete={onHoldComplete}
        size={96}
        holdDurationMs={650}
        buttonColor="#ff0000"
        accessibilityLabel="Hold to stop and save"
      />
    );

    const button = getByLabelText('Hold to stop and save');
    fireEvent(button, 'pressIn');

    act(() => {
      jest.advanceTimersByTime(649);
    });
    expect(onHoldComplete).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onHoldComplete).toHaveBeenCalledTimes(1);
  });

  it('does not trigger when released before hold duration', () => {
    const onHoldComplete = jest.fn();
    const { getByLabelText } = render(
      <HoldToStopButton
        onHoldComplete={onHoldComplete}
        size={96}
        holdDurationMs={650}
        buttonColor="#ff0000"
        accessibilityLabel="Hold to stop and save"
      />
    );

    const button = getByLabelText('Hold to stop and save');
    fireEvent(button, 'pressIn');

    act(() => {
      jest.advanceTimersByTime(300);
    });
    fireEvent(button, 'pressOut');

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(onHoldComplete).not.toHaveBeenCalled();
  });

  it('does not start hold timer when disabled', () => {
    const onHoldComplete = jest.fn();
    const { getByLabelText } = render(
      <HoldToStopButton
        onHoldComplete={onHoldComplete}
        size={96}
        holdDurationMs={650}
        buttonColor="#ff0000"
        accessibilityLabel="Hold to stop and save"
        disabled
      />
    );

    const button = getByLabelText('Hold to stop and save');
    fireEvent(button, 'pressIn');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(onHoldComplete).not.toHaveBeenCalled();
  });
});

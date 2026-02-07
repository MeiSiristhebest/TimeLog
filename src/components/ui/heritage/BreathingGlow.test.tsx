import { act, render } from '@testing-library/react-native';
import { BreathingGlow, resolveBreathingProfile } from './BreathingGlow';

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      primary: '#D97757',
    },
  }),
}));

describe('BreathingGlow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('mounts hidden on the first frame', () => {
    const view = render(<BreathingGlow />);
    const tree = view.toJSON();
    expect(tree).not.toBeNull();
    const styleProp = (tree as { props?: { style?: unknown } })?.props?.style;
    const styles = Array.isArray(styleProp) ? styleProp : [styleProp];
    const merged = Object.assign({}, ...styles.filter(Boolean));
    expect(merged.opacity).toBe(0);
  });

  it('renders glow after warm-up delay', () => {
    const view = render(<BreathingGlow />);

    act(() => {
      jest.advanceTimersByTime(160);
    });

    expect(view.toJSON()).not.toBeNull();
  });
});

describe('resolveBreathingProfile', () => {
  it('uses stronger animation envelope for recording than home', () => {
    const home = resolveBreathingProfile('home', 1);
    const recording = resolveBreathingProfile('recording', 1);

    expect(recording.pulseMaxOpacity).toBeGreaterThan(home.pulseMaxOpacity);
    expect(recording.maxScale).toBeGreaterThan(home.maxScale);
    expect(recording.durationMs).toBeGreaterThan(home.durationMs);
  });
});

import { fireEvent, render } from '@testing-library/react-native';
import { RecordingModeSwitcher } from './RecordingModeSwitcher';

jest.mock('react-native-reanimated', () => {
  const Reanimated = jest.requireActual('react-native-reanimated/mock');
  Reanimated.useSharedValue = (value: number) => ({ value });
  Reanimated.useAnimatedStyle = (updater: () => unknown) => {
    const source = String(updater);
    if (source.includes('getPillWidth(') || source.includes('getTrackWidth(')) {
      throw new Error(
        '[Worklets] Tried to synchronously call a non-worklet function from a worklet: helper function in useAnimatedStyle'
      );
    }
    return updater();
  };
  Reanimated.withSpring = (value: number) => value;
  return Reanimated;
});

jest.mock('@/components/ui/Icon', () => ({
  Icon: () => null,
}));

jest.mock('@/components/ui/AppText', () => {
  const { Text } = require('react-native');
  return { AppText: Text };
});

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    colors: {
      surface: '#fff',
      primary: '#111',
      tertiary: '#222',
      textMuted: '#333',
    },
    typography: {
      body: 24,
      title: 28,
      subtitle: 26,
      caption: 20,
      label: 22,
    },
    radius: { pill: 999 },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    animation: {},
    animationDurations: {},
    fontScaleIndex: 1,
    isDark: false,
  }),
}));

jest.mock('@/tw/animated', () => {
  const { View, Pressable, ScrollView, Text } = require('react-native');
  return {
    Animated: {
      View,
      Pressable,
      ScrollView,
      Text,
    },
  };
});

describe('RecordingModeSwitcher', () => {
  it('calls onSwitch when pressing AI mode', () => {
    const onSwitch = jest.fn();
    const { getByText } = render(<RecordingModeSwitcher mode="basic" onSwitch={onSwitch} />);

    fireEvent.press(getByText('AI Mode'));
    expect(onSwitch).toHaveBeenCalledWith('ai');
  });

  it('does not call onSwitch when disabled', () => {
    const onSwitch = jest.fn();
    const { getByText } = render(
      <RecordingModeSwitcher mode="ai" onSwitch={onSwitch} disabled />
    );

    fireEvent.press(getByText('Classic'));
    expect(onSwitch).not.toHaveBeenCalled();
  });
});

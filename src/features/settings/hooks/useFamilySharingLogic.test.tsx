import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { useFamilySharingLogic } from './useSettingsLogic';
import { HeritageAlert } from '@/components/ui/HeritageAlert';

const mockPush = jest.fn();
const mockUseProfile = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('./useProfile', () => ({
  useProfile: () => mockUseProfile(),
}));

jest.mock('@/components/ui/HeritageAlert', () => ({
  HeritageAlert: { show: jest.fn() },
}));

function Harness({ action }: { action: 'family' | 'invite' | 'accept' | 'ask' }) {
  const { actions } = useFamilySharingLogic();
  const handlePress = () => {
    switch (action) {
      case 'family':
        actions.navigateToFamilyMembers();
        break;
      case 'invite':
        actions.navigateToInvite();
        break;
      case 'accept':
        actions.navigateToAcceptInvite();
        break;
      case 'ask':
        actions.navigateToAskQuestion();
        break;
    }
  };
  return (
    <Pressable onPress={handlePress} testID="action">
      <Text>Trigger</Text>
    </Pressable>
  );
}

describe('useFamilySharingLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prompts upgrade for anonymous users', () => {
    mockUseProfile.mockReturnValue({ profile: { isAnonymous: true } });
    const { getByTestId } = render(<Harness action="family" />);
    fireEvent.press(getByTestId('action'));
    expect(HeritageAlert.show).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('navigates directly for upgraded users', () => {
    mockUseProfile.mockReturnValue({ profile: { isAnonymous: false } });
    const { getByTestId } = render(<Harness action="invite" />);
    fireEvent.press(getByTestId('action'));
    expect(HeritageAlert.show).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/invite');
  });
});

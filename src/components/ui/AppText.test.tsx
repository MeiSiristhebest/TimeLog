import { render } from '@testing-library/react-native';
import { AppText } from './AppText';

jest.mock('@/theme/heritage', () => ({
  useHeritageTheme: () => ({
    typography: { body: 24, title: 28, subtitle: 26, caption: 20, label: 22 },
  }),
}));

describe('AppText', () => {
  it('uses body size by default', () => {
    const { getByText } = render(<AppText>Sample</AppText>);
    const node = getByText('Sample');
    expect(node.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontSize: 24 })])
    );
  });
});

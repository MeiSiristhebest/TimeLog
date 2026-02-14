import {
  getRootStackDefaultScreenOptions,
  ROOT_STACK_ROUTES,
} from '@/features/app/navigation/rootStackConfig';

describe('rootStackConfig', () => {
  it('builds default stack options from theme colors', () => {
    const options = getRootStackDefaultScreenOptions({
      surfaceDim: '#111111',
      primary: '#aabbcc',
      onSurface: '#ffffff',
    });

    expect(options.animation).toBe('slide_from_right');
    expect(options.headerShown).toBe(false);
    expect(options.headerStyle).toEqual(
      expect.objectContaining({
        backgroundColor: '#111111',
      })
    );
    expect(options.headerTintColor).toBe('#aabbcc');
    expect(options.headerTitleStyle).toEqual(
      expect.objectContaining({
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 18,
      })
    );
  });

  it('contains key routes with expected overrides', () => {
    const byName = new Map(ROOT_STACK_ROUTES.map((route) => [route.name, route.options]));

    expect(byName.get('details')).toEqual(
      expect.objectContaining({
        title: 'Details',
        animation: 'slide_from_bottom',
      })
    );
    expect(byName.get('splash')).toEqual(
      expect.objectContaining({
        headerShown: false,
        animation: 'fade',
      })
    );
    expect(byName.get('(auth)/welcome')).toEqual(
      expect.objectContaining({
        headerShown: false,
        animation: 'fade',
      })
    );
  });
});

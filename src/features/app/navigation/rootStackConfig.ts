import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export interface RootStackThemeColors {
  readonly surfaceDim: string;
  readonly primary: string;
  readonly onSurface: string;
}

export interface RootStackRouteConfig {
  readonly name: string;
  readonly options?: NativeStackNavigationOptions;
}

export function getRootStackDefaultScreenOptions(
  colors: Readonly<RootStackThemeColors>
): NativeStackNavigationOptions {
  return {
    animation: 'slide_from_right',
    animationDuration: 400,
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    headerShown: false,
    contentStyle: {
      backgroundColor: colors.surfaceDim,
    },
    headerStyle: {
      backgroundColor: colors.surfaceDim,
    },
    headerTintColor: colors.primary,
    headerTitleStyle: {
      color: colors.onSurface,
      fontWeight: '600',
      fontSize: 18,
    },
    headerShadowVisible: false,
  };
}

export const ROOT_STACK_ROUTES: readonly RootStackRouteConfig[] = [
  { name: 'index' },
  { name: '(tabs)', options: { headerShown: false } },
  { name: 'details', options: { title: 'Details', animation: 'slide_from_bottom' } },
  { name: '(auth)/login', options: { title: 'Login' } },
  { name: 'device-management', options: { headerShown: false } },
  { name: '(auth)/invite', options: { headerShown: false } },
  { name: '(auth)/accept-invite', options: { headerShown: false } },
  { name: 'ask-question', options: { headerShown: false } },
  { name: 'role', options: { headerShown: false } },
  { name: '(auth)/device-code', options: { headerShown: false } },
  { name: '(auth)/help', options: { headerShown: false } },
  { name: '(auth)/consent-review', options: { headerShown: false } },
  { name: 'family-members', options: { headerShown: false } },
  { name: '(auth)/recovery-code', options: { headerShown: false } },
  { name: 'story/[id]' },
  { name: 'story-comments/[id]' },
  { name: 'family-story/[id]' },
  { name: 'upgrade-account' },
  { name: 'splash', options: { headerShown: false, animation: 'fade' } },
  { name: '(auth)/welcome', options: { headerShown: false, animation: 'fade' } },
] as const;

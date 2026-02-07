declare module '@expo-google-fonts/fraunces' {
  import type { FontSource } from 'expo-font';
  export function useFonts(map: Record<string, FontSource>): [boolean, Error | null];
  export const Fraunces_300Light: FontSource;
  export const Fraunces_400Regular: FontSource;
  export const Fraunces_600SemiBold: FontSource;
  export const Fraunces_700Bold: FontSource;
}

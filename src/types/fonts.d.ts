declare module '@expo-google-fonts/fraunces' {
  import type { FontSource } from 'expo-font';
  export function useFonts(map: Record<string, FontSource>): [boolean, Error | null];
  export const Fraunces_600SemiBold: FontSource;
}

import * as SplashScreen from 'expo-splash-screen';
import { initializeLiveKit } from '@/lib/livekit';

let isBootstrapped = false;

export function bootstrapNativeRuntime(): void {
  if (isBootstrapped) {
    return;
  }

  initializeLiveKit();
  void SplashScreen.preventAutoHideAsync();
  isBootstrapped = true;
}

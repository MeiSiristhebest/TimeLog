import { LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { initializeLiveKit } from '@/lib/livekit';
import { runGarbageCollection } from '@/features/recorder/services/recorderService';

let isBootstrapped = false;

export function bootstrapNativeRuntime(): void {
  if (isBootstrapped) {
    return;
  }

  // Disable all LogBox overlays for clean UI during demonstrations
  LogBox.ignoreAllLogs();

  initializeLiveKit();
  void runGarbageCollection();
  void SplashScreen.preventAutoHideAsync();
  isBootstrapped = true;
}

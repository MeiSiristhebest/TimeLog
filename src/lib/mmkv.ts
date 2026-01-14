import { MMKV } from 'react-native-mmkv';

// @ts-expect-error: react-native-mmkv v4 uses Nitro Modules - MMKV constructor is provided at runtime by native code
export const mmkv = new MMKV({
  id: 'timelog',
});

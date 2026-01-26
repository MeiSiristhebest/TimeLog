declare module 'expo-file-system/legacy' {
  export * from 'expo-file-system';
  export function getInfoAsync(
    fileUri: string,
    options?: { md5?: boolean; size?: boolean }
  ): Promise<{ exists: boolean; uri: string; size?: number; md5?: string; isDirectory?: boolean }>;
}

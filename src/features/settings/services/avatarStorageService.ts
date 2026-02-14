import * as FileSystem from 'expo-file-system/legacy';

type FileSystemWithDirectories = typeof FileSystem & {
  documentDirectory?: string | null;
  cacheDirectory?: string | null;
};

const fileSystemWithDirectories = FileSystem as FileSystemWithDirectories;

export async function persistAvatarAssetUri(uri: string): Promise<string> {
  const baseDir =
    fileSystemWithDirectories.documentDirectory ?? fileSystemWithDirectories.cacheDirectory;
  if (!baseDir) {
    return uri;
  }

  const avatarDir = `${baseDir}avatars/`;
  const info = await FileSystem.getInfoAsync(avatarDir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(avatarDir, { intermediates: true });
  }

  const extMatch = uri.match(/\.(jpg|jpeg|png|webp|heic)(?:\?|$)/i);
  const extension = extMatch?.[1]?.toLowerCase() ?? 'jpg';
  const targetUri = `${avatarDir}avatar_${Date.now()}.${extension}`;
  await FileSystem.copyAsync({ from: uri, to: targetUri });

  return targetUri;
}

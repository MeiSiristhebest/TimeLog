/**
 * Extended type declarations for expo-file-system
 *
 * Adds missing properties and extends the base types from expo-file-system/legacy
 */

declare module 'expo-file-system/legacy' {
  /**
   * Extended FileInfo interface that includes md5 checksum and all base properties.
   * This is used when calling getInfoAsync with { md5: true }
   */
  export interface FileInfoWithMd5 {
    /** Whether the file or directory exists */
    exists: boolean;
    /** The URI of the file */
    uri: string;
    /** File size in bytes (only present if exists is true) */
    size?: number;
    /** Whether this is a directory */
    isDirectory?: boolean;
    /** Last modification time in milliseconds since epoch */
    modificationTime?: number;
    /** MD5 checksum of the file (when requested via options) */
    md5?: string;
  }
}

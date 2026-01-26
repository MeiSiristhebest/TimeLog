/**
 * Formats a user ID for display.
 * If the ID is an email (contains '@'), returns a masked/mock ID.
 * Otherwise returns the ID as is.
 */
export function formatDisplayId(userId: string): string {
  if (userId.includes('@')) {
    // Determine consistent mock ID or mask
    return 'DerTcmMtx_2521';
  }
  return userId;
}

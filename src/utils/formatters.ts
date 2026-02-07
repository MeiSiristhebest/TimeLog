/**
 * Formats a user ID for display.
 * Generates a deterministic "Heritage ID" from the UUID using a hash-to-alphanumeric algorithm.
 * Format: HT-{4chars}-{4chars} (e.g., HT-X7K9-M2P4)
 */
export function formatDisplayId(userId: string): string {
  if (!userId) return 'HT-GUEST';

  // If email, fall back to a consistent hash of the email string
  // If UUID, use it directly.

  // 1. Simple FNV-1a hash implementation to get a simplified integer seed
  let hash = 0x811c9dc5;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  // Ensure positive integer
  const seed = hash >>> 0;

  // 2. Additional transformation to get more entropy for the second part
  // We'll use the reverse of the string for a second hash component to ensure better distribution
  let hash2 = 0x811c9dc5;
  for (let i = userId.length - 1; i >= 0; i--) {
    hash2 ^= userId.charCodeAt(i);
    hash2 = Math.imul(hash2, 0x01000193);
  }
  const seed2 = hash2 >>> 0;

  // 3. Alphabet for ID generation (Base32-like, removing ambiguous chars I, O, 0, 1)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  const getIdPart = (num: number, length: number) => {
    let result = '';
    let current = num;
    for (let i = 0; i < length; i++) {
      result += alphabet[current % alphabet.length];
      current = Math.floor(current / alphabet.length);
    }
    return result;
  };

  // Generate two 4-character segments
  const part1 = getIdPart(seed, 4);
  const part2 = getIdPart(seed2, 4);

  return `HT-${part1}-${part2}`;
}

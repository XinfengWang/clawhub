/**
 * Password hashing and verification utilities
 * Uses a simple but functional approach for dev mode
 */

/**
 * Simple hash function using string manipulation
 * NOT for production - just for dev mode testing
 */
function simpleHash(str: string, salt: string): string {
  let hash = 0;
  const combined = str + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Hash a password with a random salt
 * @param password Plain text password
 * @returns Promise resolving to salt:hash format
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a salt
  const salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  // Compute hash
  const hash = simpleHash(password, salt);

  // Return salt:hash format
  return `${salt}:${hash}`;
}

/**
 * Verify a password against its hash
 * @param password Plain text password
 * @param storedHash Stored hash in format salt:hash
 * @returns Promise resolving to true if password matches
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Extract salt and expected hash
    const parts = storedHash.split(":");
    if (parts.length !== 2) {
      return false;
    }

    const [salt, expectedHash] = parts;

    // Recompute hash with extracted salt
    const computedHash = simpleHash(password, salt);

    // Compare hashes
    return computedHash === expectedHash;
  } catch {
    return false;
  }
}

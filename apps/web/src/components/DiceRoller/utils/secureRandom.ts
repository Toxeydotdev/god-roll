/**
 * Cryptographically secure random number utilities
 * Uses Web Crypto API for unpredictable randomness
 */

/**
 * Returns a cryptographically secure random number between 0 (inclusive) and 1 (exclusive)
 * Similar to Math.random() but unpredictable
 */
export function secureRandom(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 0x100000000; // Divide by 2^32 for 0-1 range
}

/**
 * Returns a cryptographically secure random number in a range
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 */
export function secureRandomRange(min: number, max: number): number {
  return min + secureRandom() * (max - min);
}

/**
 * Returns a cryptographically secure random integer in a range
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 */
export function secureRandomInt(min: number, max: number): number {
  return Math.floor(secureRandomRange(min, max + 1));
}

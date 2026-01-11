/**
 * HMAC Signature Utilities for Score Verification
 *
 * Uses Web Crypto API to generate HMAC-SHA256 signatures for score submissions.
 * This helps prevent score tampering by signing the payload with a shared secret.
 */

// The signing key is derived from a combination of factors to make it harder to extract
// In production, consider using a server-provided nonce for additional security
const SIGNING_KEY_PARTS = [
  "gR0ll", // App identifier
  "v1", // Version
  "2026", // Year
  "s3cr3t", // Base secret
];

/**
 * Get the signing key bytes
 */
async function getSigningKey(): Promise<CryptoKey> {
  const keyMaterial = SIGNING_KEY_PARTS.join("-");
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);

  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create a canonical string from score data for signing
 * Order matters! Must match server-side implementation exactly.
 */
function createCanonicalString(data: {
  playerId: string;
  score: number;
  roundsSurvived: number;
  sessionId: string;
  timestamp: number;
}): string {
  // Create a deterministic string representation
  return [
    `pid:${data.playerId}`,
    `sc:${data.score}`,
    `rnd:${data.roundsSurvived}`,
    `sid:${data.sessionId}`,
    `ts:${data.timestamp}`,
  ].join("|");
}

/**
 * Generate HMAC signature for score submission
 */
export async function generateScoreSignature(data: {
  playerId: string;
  score: number;
  roundsSurvived: number;
  sessionId: string;
  timestamp: number;
}): Promise<string> {
  try {
    const key = await getSigningKey();
    const canonicalString = createCanonicalString(data);
    const encoder = new TextEncoder();
    const messageData = encoder.encode(canonicalString);

    const signature = await crypto.subtle.sign("HMAC", key, messageData);

    return bufferToHex(signature);
  } catch (error) {
    console.error("Error generating HMAC signature:", error);
    throw new Error("Failed to generate signature");
  }
}

/**
 * Verify the timestamp is within acceptable range (5 minutes)
 */
export function isTimestampValid(
  timestamp: number,
  maxAgeMs: number = 5 * 60 * 1000
): boolean {
  const now = Date.now();
  return Math.abs(now - timestamp) <= maxAgeMs;
}

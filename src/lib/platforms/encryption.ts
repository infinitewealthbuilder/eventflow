/**
 * EventFlow - Token Encryption
 * Application-level encryption for OAuth tokens
 *
 * Uses AES-256-GCM for authenticated encryption
 * Key should be stored in OAUTH_ENCRYPTION_KEY env var (32 bytes hex)
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length
const TAG_LENGTH = 16;

/**
 * Get the encryption key from environment
 * Must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.OAUTH_ENCRYPTION_KEY;

  if (!key) {
    // In development, use a deterministic key (NOT for production!)
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'OAUTH_ENCRYPTION_KEY not set - using development key. DO NOT USE IN PRODUCTION!'
      );
      return crypto.scryptSync('dev-only-key', 'salt', 32);
    }
    throw new Error(
      'OAUTH_ENCRYPTION_KEY environment variable is required for token encryption'
    );
  }

  // Key should be 64 hex characters (32 bytes)
  if (key.length !== 64) {
    throw new Error(
      'OAUTH_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate with: openssl rand -hex 32'
    );
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a string value
 * Returns base64 encoded string: iv:ciphertext:authTag
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Combine iv:ciphertext:authTag
  return `${iv.toString('base64')}:${ciphertext}:${authTag.toString('base64')}`;
}

/**
 * Decrypt a string value
 * Expects base64 encoded string: iv:ciphertext:authTag
 */
export function decrypt(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format');
  }

  const [ivBase64, ciphertext, authTagBase64] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');

  if (iv.length !== IV_LENGTH) {
    throw new Error('Invalid IV length');
  }

  if (authTag.length !== TAG_LENGTH) {
    throw new Error('Invalid auth tag length');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertext, 'base64', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

/**
 * Check if a value appears to be encrypted (has the expected format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;

  try {
    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[2], 'base64');
    return iv.length === IV_LENGTH && authTag.length === TAG_LENGTH;
  } catch {
    return false;
  }
}

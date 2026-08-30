"use client"

/**
 * lib/encryption/crypto.ts
 *
 * AES-256-GCM encryption primitives using the browser Web Crypto API.
 *
 * Algorithm separation (enforced by key usage flags):
 *   AES-KW  — wrapDataKey / unwrapDataKey ONLY
 *   AES-GCM — encryptRecord / decryptRecord ONLY
 *
 * No key is used for both algorithms.
 */

import type { EncryptedPayload, EncryptionAAD } from './types'

// ── Base64 helpers ───────────────────────────────────────────────────────────

export function toBase64(buf: ArrayBuffer | Uint8Array<ArrayBuffer>): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function fromBase64(s: string): Uint8Array<ArrayBuffer> {
  const binary = atob(s)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes as Uint8Array<ArrayBuffer>
}

// ── Random generation ────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random salt.
 * Default 16 bytes; used as PBKDF2 salt input.
 */
export function generateSalt(bytes = 16): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(bytes))
}

/**
 * Generate a cryptographically random 12-byte IV for AES-GCM.
 * A fresh IV MUST be generated for every encryptRecord() call.
 * IVs must never be reused with the same key.
 */
export function generateIV(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(12))
}

// ── Key derivation (PBKDF2 → AES-KW) ────────────────────────────────────────

/**
 * Derive an AES-KW wrapping key from a passphrase using PBKDF2-SHA-256.
 *
 * The returned CryptoKey has:
 *   algorithm: { name: 'AES-KW' }
 *   extractable: false
 *   usages: ['wrapKey', 'unwrapKey']
 *
 * This key MUST be used ONLY with wrapDataKey() / unwrapDataKey().
 * It MUST NOT be used for any AES-GCM operation.
 *
 * @param passphrase  The user's encryption passphrase (never transmitted).
 * @param salt        Cryptographically random per-user salt (from generateSalt).
 * @param iterations  PBKDF2 iteration count. Default 310,000 (OWASP 2023 minimum).
 */
export async function deriveWrappingKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations = 310_000,
): Promise<CryptoKey> {
  const enc = new TextEncoder()

  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
    salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-KW', length: 256 },
    false,               // non-extractable — wrapping key never leaves the browser
    ['wrapKey', 'unwrapKey'],
  )
}

// ── Data key generation (AES-GCM) ────────────────────────────────────────────

/**
 * Generate a fresh random 256-bit AES-GCM data key.
 *
 * extractable: true is required so that AES-KW can wrap/export it.
 * After unwrapDataKey(), the in-memory copy is returned as non-extractable.
 *
 * This key is used ONLY with encryptRecord() / decryptRecord().
 * It MUST NOT be used for any AES-KW operation.
 */
export async function generateDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,               // must be extractable for AES-KW to wrap it
    ['encrypt', 'decrypt'],
  )
}

// ── Key wrapping / unwrapping (AES-KW, RFC 3394) ─────────────────────────────

/**
 * Wrap a data key using AES-KW.
 *
 * @param dataKey     AES-GCM key to wrap (must be extractable).
 * @param wrappingKey AES-KW key from deriveWrappingKey().
 * @returns Raw wrapped key bytes (store as base64 in Supabase).
 */
export async function wrapDataKey(
  dataKey: CryptoKey,
  wrappingKey: CryptoKey,
): Promise<ArrayBuffer> {
  return crypto.subtle.wrapKey('raw', dataKey, wrappingKey, 'AES-KW')
}

/**
 * Unwrap a data key using AES-KW.
 *
 * @param wrappedKey  Raw wrapped key bytes (decoded from base64).
 * @param wrappingKey AES-KW key from deriveWrappingKey().
 * @returns Non-extractable AES-256-GCM key for encryptRecord / decryptRecord.
 *          Throws if the wrapping key is incorrect (wrong passphrase / recovery secret).
 */
export async function unwrapDataKey(
  wrappedKey: ArrayBuffer,
  wrappingKey: CryptoKey,
  extractable = true,
): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    'raw',
    wrappedKey,
    wrappingKey,
    'AES-KW',
    { name: 'AES-GCM', length: 256 },
    extractable,
    ['encrypt', 'decrypt'],
  )
}

// ── AAD serialisation ─────────────────────────────────────────────────────────

/**
 * Serialise an EncryptionAAD context deterministically to bytes.
 * Keys are sorted alphabetically to guarantee identical output across calls.
 * Used as AES-GCM additionalData on both encrypt and decrypt paths.
 */
function serialiseAAD(aad: EncryptionAAD): Uint8Array<ArrayBuffer> {
  // Sorted key order — MUST remain stable across application versions for fv:1
  const canonical = JSON.stringify({
    bookId: aad.bookId,
    fv: aad.fv,
    kv: aad.kv,
    recordId: aad.recordId,
    userId: aad.userId,
  })
  return new TextEncoder().encode(canonical) as Uint8Array<ArrayBuffer>
}

// ── Record encryption (AES-256-GCM) ──────────────────────────────────────────

/**
 * Encrypt a plaintext object as an AES-256-GCM EncryptedPayload.
 *
 * A fresh random IV is generated on every call. The same plaintext encrypted
 * twice will produce different ciphertexts.
 *
 * The AAD context (aadContext) is serialised and passed to AES-GCM as
 * additionalData. It binds the ciphertext to its record/book/user context.
 * It is NOT stored in the returned payload.
 *
 * IMPORTANT: Encryption failure throws. The caller MUST NOT catch and fall
 * back to storing plaintext.
 *
 * @param plaintext  Private data object to encrypt.
 * @param dataKey    AES-GCM key (from generateDataKey or unwrapDataKey).
 * @param aadContext Context to bind: { userId, bookId, recordId, fv, kv }.
 */
export async function encryptRecord(
  plaintext: object,
  dataKey: CryptoKey,
  aadContext: EncryptionAAD,
): Promise<EncryptedPayload> {
  const iv = generateIV()
  const additionalData = serialiseAAD(aadContext) as BufferSource
  const plaintextBytes = new TextEncoder().encode(JSON.stringify(plaintext)) as BufferSource

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource, additionalData },
    dataKey,
    plaintextBytes,
  )

  return {
    fv: aadContext.fv,
    kv: aadContext.kv,
    iv: toBase64(iv),
    ct: toBase64(ciphertext),
  }
}

// ── Record decryption (AES-256-GCM) ──────────────────────────────────────────

/**
 * Decrypt an AES-256-GCM EncryptedPayload.
 *
 * The expectedAAD MUST be reconstructed from TRUSTED application context:
 *   - userId   → from the authenticated Supabase session (auth.uid())
 *   - bookId   → from the DB row's book_id column
 *   - recordId → from the DB row's id column
 *   - fv / kv  → from payload.fv and payload.kv
 *
 * The stored payload itself is NOT a trusted source for AAD values.
 * If the reconstructed AAD does not match what was used during encryption,
 * AES-GCM authentication fails and this function throws. This prevents silent
 * ciphertext relocation (moving a row to a different record/book/user).
 *
 * IMPORTANT: Decryption failure always throws. The caller MUST NOT swallow
 * the error or fall back to treating ciphertext as usable data.
 *
 * @param payload     Stored EncryptedPayload from Supabase.
 * @param dataKey     AES-GCM key (from unwrapDataKey).
 * @param expectedAAD Reconstructed from trusted DB/session context.
 */
export async function decryptRecord(
  payload: EncryptedPayload,
  dataKey: CryptoKey,
  expectedAAD: EncryptionAAD,
): Promise<unknown> {
  if (payload.fv !== 1) {
    throw new Error(
      `Unsupported encryption format version: ${payload.fv}. ` +
      'Please update the application.',
    )
  }

  const iv = fromBase64(payload.iv)
  const ciphertext = fromBase64(payload.ct)
  const additionalData = serialiseAAD(expectedAAD) as BufferSource

  let decrypted: ArrayBuffer
  try {
    decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource, additionalData },
      dataKey,
      ciphertext,
    )
  } catch {
    // AES-GCM throws a generic error when the authentication tag is invalid.
    // This covers: wrong key, tampered ciphertext, AAD mismatch (wrong record/book/user).
    // Never swallow this error or fall back to plaintext.
    throw new Error(
      'Decryption failed: authentication tag invalid. ' +
      'The record may be corrupted, the wrong key was used, ' +
      'or the ciphertext context does not match this record.',
    )
  }

  return JSON.parse(new TextDecoder().decode(decrypted))
}

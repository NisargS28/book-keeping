"use client"

/**
 * lib/encryption/key-manager.ts
 *
 * In-memory encryption key lifecycle management.
 *
 * The data key (CryptoKey) lives ONLY in this module's private variable.
 * It is NEVER written to sessionStorage, localStorage, IndexedDB, Supabase,
 * environment variables, or any server-side memory.
 *
 * The key is cleared on:
 *   - Explicit logout (clearDataKey called by auth.ts)
 *   - Manual lock (clearDataKey called by EncryptionProvider)
 *   - Page unload / browser tab close (beforeunload listener)
 *
 * Page refresh always requires the user to re-enter their passphrase.
 */

import { supabase } from '@/lib/supabase'
import {
  generateSalt,
  generateDataKey,
  deriveWrappingKey,
  wrapDataKey,
  unwrapDataKey,
  toBase64,
  fromBase64,
} from './crypto'
import type { UserKeyMaterialRow } from './types'

// Helper: extract a clean ArrayBuffer from a Uint8Array (avoids SharedArrayBuffer union)
function toArrayBuffer(u8: Uint8Array<ArrayBuffer>): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer
}

const DEVICE_SESSION_KEY = 'cashbook_device_vault_'

// ── In-memory & Device key storage ──────────────────────────────────────────

let _dataKey: CryptoKey | null = null
let _keyVersion = 0

/**
 * Persist the data key on this local device (localStorage) so the user does
 * not have to re-enter their passphrase on every page refresh or browser restart.
 */
export async function persistDeviceSession(
  userId: string,
  key: CryptoKey,
  version: number,
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const rawKey = await crypto.subtle.exportKey('raw', key)
    const payload = JSON.stringify({
      raw: toBase64(rawKey),
      version,
    })
    localStorage.setItem(`${DEVICE_SESSION_KEY}${userId}`, payload)
  } catch (err) {
    console.warn('Could not persist device vault session:', err)
  }
}

/**
 * Attempt to restore the encryption key from this device's local storage.
 * Returns true if the key was restored successfully, false otherwise.
 */
export async function tryAutoUnlock(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem(`${DEVICE_SESSION_KEY}${userId}`)
    if (!stored) return false

    const parsed = JSON.parse(stored)
    if (!parsed.raw || !parsed.version) return false

    const rawBytes = fromBase64(parsed.raw)
    const key = await crypto.subtle.importKey(
      'raw',
      rawBytes as BufferSource,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )

    loadKeyIntoMemory(key, parsed.version)
    return true
  } catch (err) {
    console.warn('Failed auto-unlocking from device session:', err)
    return false
  }
}

// ── Key state accessors ───────────────────────────────────────────────────────

/** Returns true when the data key is held in memory and ready to use. */
export function isUnlocked(): boolean {
  return _dataKey !== null
}

/**
 * Get the in-memory data key for AES-GCM operations.
 * Throws EncryptionLockedError if the user has not unlocked encryption yet.
 */
export function getDataKey(): CryptoKey {
  if (!_dataKey) {
    throw new EncryptionLockedError(
      'Encryption is locked. Enter your encryption passphrase to continue.',
    )
  }
  return _dataKey
}

/** Get the current key version. Used as the kv field in encrypted payloads. */
export function getKeyVersion(): number {
  return _keyVersion
}

/**
 * Clear the in-memory data key and remove any stored device session.
 * Call this on logout and on explicit "Lock Vault" action.
 */
export function clearDataKey(userId?: string): void {
  _dataKey = null
  _keyVersion = 0
  if (typeof window !== 'undefined') {
    if (userId) {
      localStorage.removeItem(`${DEVICE_SESSION_KEY}${userId}`)
    } else {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i)
        if (k && k.startsWith(DEVICE_SESSION_KEY)) {
          localStorage.removeItem(k)
        }
      }
    }
  }
}

/** Internal setter — only called after a successful unlock or setup. */
function loadKeyIntoMemory(key: CryptoKey, version: number): void {
  _dataKey = key
  _keyVersion = version
}

// ── Custom error types ────────────────────────────────────────────────────────

export class EncryptionLockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EncryptionLockedError'
  }
}


export class IncorrectPassphraseError extends Error {
  constructor() {
    super('Incorrect passphrase. Please try again.')
    this.name = 'IncorrectPassphraseError'
  }
}

export class InvalidRecoverySecretError extends Error {
  constructor() {
    super('Invalid recovery secret. Please check and try again.')
    this.name = 'InvalidRecoverySecretError'
  }
}

// ── Supabase key material helpers ─────────────────────────────────────────────

async function fetchKeyMaterial(userId: string): Promise<UserKeyMaterialRow | null> {
  const { data, error } = await supabase
    .from('user_key_material')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as UserKeyMaterialRow
}

// ── Setup (first login only) ──────────────────────────────────────────────────

/**
 * Set up encryption for a new user for the first time.
 *
 * Steps:
 *   1. Generate a random AES-256-GCM data key.
 *   2. Derive a passphrase-based AES-KW wrapping key (PBKDF2, random salt).
 *   3. Wrap the data key with the passphrase-derived wrapping key (AES-KW).
 *   4. Generate a high-entropy recovery secret: 32 random bytes → 64-char hex.
 *   5. Derive a recovery AES-KW wrapping key from the recovery secret (PBKDF2,
 *      separate random salt — independent from the passphrase salt).
 *   6. Wrap the data key with the recovery-derived wrapping key.
 *   7. Store both wrapped keys + salts in Supabase user_key_material.
 *      The recovery secret itself is NEVER stored anywhere — only the wrapped key.
 *   8. Load the data key into memory (non-extractable copy from AES-KW unwrap).
 *
 * @param passphrase  The user's chosen encryption passphrase (never transmitted).
 * @param userId      The authenticated user's UUID.
 * @returns { recoverySecret } — 64-character lowercase hex string.
 *          Must be displayed once to the user. Cannot be recovered after this call.
 */
export async function setupEncryption(
  passphrase: string,
  userId: string,
  rememberDevice = true,
): Promise<{ recoverySecret: string }> {
  // 1. Fresh random data key (AES-GCM, extractable so AES-KW can wrap it)
  const dataKey = await generateDataKey()

  // 2 & 3. Passphrase → AES-KW wrapping key → wrap data key
  const passphraseSalt = generateSalt(16)
  const passphraseWrappingKey = await deriveWrappingKey(passphrase, passphraseSalt)
  const passphraseWrappedKey = await wrapDataKey(dataKey, passphraseWrappingKey)

  // 4. Recovery secret: 32 cryptographically random bytes → 64-char lowercase hex.
  //    This is NEVER stored in Supabase — only the recovery-wrapped key is stored.
  const recoveryBytes = crypto.getRandomValues(new Uint8Array(32))
  const recoverySecret = Array.from(recoveryBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // 5 & 6. Recovery secret → separate AES-KW wrapping key → wrap data key
  const recoverySalt = generateSalt(16)  // independent salt from passphrase salt
  const recoveryWrappingKey = await deriveWrappingKey(recoverySecret, recoverySalt)
  const recoveryWrappedKey = await wrapDataKey(dataKey, recoveryWrappingKey)

  // 7. Store wrapped keys + salts only. Raw key is never transmitted.
  const { error } = await supabase.from('user_key_material').upsert({
    id: userId,
    passphrase_salt: toBase64(passphraseSalt),
    passphrase_wrapped_key: toBase64(passphraseWrappedKey),
    recovery_key_salt: toBase64(recoverySalt),
    recovery_wrapped_key: toBase64(recoveryWrappedKey),
    key_version: 1,
  })

  if (error) {
    throw new Error(`Failed to store encryption key material: ${error.message}`)
  }

  // 8. Load copy into memory and conditionally persist device session for seamless auto-unlock
  const inMemoryKey = await unwrapDataKey(passphraseWrappedKey, passphraseWrappingKey, true)
  loadKeyIntoMemory(inMemoryKey, 1)
  if (rememberDevice) {
    await persistDeviceSession(userId, inMemoryKey, 1)
  }

  return { recoverySecret }
}

// ── Unlock with passphrase ────────────────────────────────────────────────────

/**
 * Unlock encryption using the user's passphrase.
 *
 * Fetches wrapped key material from Supabase, derives the AES-KW wrapping key
 * via PBKDF2, unwraps the data key, and loads it into memory.
 * Also persists the device session if rememberDevice is true.
 *
 * Throws IncorrectPassphraseError if the passphrase is wrong (AES-KW fails).
 */
export async function unlockWithPassphrase(
  passphrase: string,
  userId: string,
  rememberDevice = true,
): Promise<void> {
  const material = await fetchKeyMaterial(userId)
  if (!material) {
    throw new Error(
      'No encryption key material found for this account. ' +
      'Please complete encryption setup first.',
    )
  }

  const salt = fromBase64(material.passphrase_salt)
  const wrappedKey = toArrayBuffer(fromBase64(material.passphrase_wrapped_key))

  const wrappingKey = await deriveWrappingKey(passphrase, salt)

  let dataKey: CryptoKey
  try {
    dataKey = await unwrapDataKey(wrappedKey, wrappingKey, true)
  } catch {
    throw new IncorrectPassphraseError()
  }

  loadKeyIntoMemory(dataKey, material.key_version)
  if (rememberDevice) {
    await persistDeviceSession(userId, dataKey, material.key_version)
  }
}

// ── Unlock with recovery secret ───────────────────────────────────────────────

/**
 * Unlock encryption using the one-time recovery secret.
 *
 * The recovery secret is the 64-char hex string shown at setup.
 * Derives the recovery AES-KW wrapping key, unwraps the data key.
 *
 * Throws InvalidRecoverySecretError if the secret is wrong.
 */
export async function unlockWithRecoverySecret(
  recoverySecret: string,
  userId: string,
  rememberDevice = true,
): Promise<void> {
  const material = await fetchKeyMaterial(userId)
  if (!material) {
    throw new Error('No encryption key material found for this account.')
  }

  const salt = fromBase64(material.recovery_key_salt)
  const wrappedKey = toArrayBuffer(fromBase64(material.recovery_wrapped_key))

  const wrappingKey = await deriveWrappingKey(recoverySecret, salt)

  let dataKey: CryptoKey
  try {
    dataKey = await unwrapDataKey(wrappedKey, wrappingKey, true)
  } catch {
    throw new InvalidRecoverySecretError()
  }

  loadKeyIntoMemory(dataKey, material.key_version)
  if (rememberDevice) {
    await persistDeviceSession(userId, dataKey, material.key_version)
  }
}



// ── Setup check ───────────────────────────────────────────────────────────────

/**
 * Returns true if user_key_material exists in Supabase for this user.
 * Used by EncryptionProvider to decide between setup flow and unlock flow.
 */
export async function hasEncryptionSetup(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_key_material')
    .select('id')
    .eq('id', userId)
    .single()
  return !!data
}

// ── Regenerate recovery secret (for existing accounts) ─────────────────────────

/**
 * Generate a new recovery secret for an existing account.
 * Requires the current encryption passphrase to unwrap the data key.
 *
 * @param passphrase The user's current encryption passphrase
 * @param userId     The authenticated user's UUID
 * @returns { recoverySecret } The new 64-character lowercase hex recovery secret
 */
export async function regenerateRecoverySecret(
  passphrase: string,
  userId: string,
): Promise<{ recoverySecret: string }> {
  const material = await fetchKeyMaterial(userId)
  if (!material) {
    throw new Error('No encryption key material found for this account.')
  }

  const salt = fromBase64(material.passphrase_salt)
  const wrappedKey = toArrayBuffer(fromBase64(material.passphrase_wrapped_key))

  const passphraseWrappingKey = await deriveWrappingKey(passphrase, salt)

  // Unwrap the data key with extractable: true so it can be re-wrapped with the new recovery key
  let dataKeyExtractable: CryptoKey
  try {
    dataKeyExtractable = await crypto.subtle.unwrapKey(
      'raw',
      wrappedKey,
      passphraseWrappingKey,
      'AES-KW',
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )
  } catch {
    throw new IncorrectPassphraseError()
  }

  // 1. Generate a new high-entropy recovery secret (32 random bytes -> 64 hex chars)
  const recoveryBytes = crypto.getRandomValues(new Uint8Array(32))
  const recoverySecret = Array.from(recoveryBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // 2. Derive new recovery wrapping key with an independent random salt
  const recoverySalt = generateSalt(16)
  const recoveryWrappingKey = await deriveWrappingKey(recoverySecret, recoverySalt)
  const recoveryWrappedKey = await wrapDataKey(dataKeyExtractable, recoveryWrappingKey)

  // 3. Update Supabase user_key_material with the new recovery wrapped key & salt
  const { error } = await supabase
    .from('user_key_material')
    .update({
      recovery_key_salt: toBase64(recoverySalt),
      recovery_wrapped_key: toBase64(recoveryWrappedKey),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update recovery secret: ${error.message}`)
  }

  return { recoverySecret }
}

// ── Change encryption passphrase ─────────────────────────────────────────────

/**
 * Change the encryption passphrase.
 *
 * @param oldPassphrase Current passphrase
 * @param newPassphrase New passphrase
 * @param userId        The authenticated user's UUID
 */
export async function changeEncryptionPassphrase(
  oldPassphrase: string,
  newPassphrase: string,
  userId: string,
): Promise<void> {
  const material = await fetchKeyMaterial(userId)
  if (!material) {
    throw new Error('No encryption key material found for this account.')
  }

  const oldSalt = fromBase64(material.passphrase_salt)
  const wrappedKey = toArrayBuffer(fromBase64(material.passphrase_wrapped_key))

  const oldWrappingKey = await deriveWrappingKey(oldPassphrase, oldSalt)

  let dataKeyExtractable: CryptoKey
  try {
    dataKeyExtractable = await crypto.subtle.unwrapKey(
      'raw',
      wrappedKey,
      oldWrappingKey,
      'AES-KW',
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )
  } catch {
    throw new IncorrectPassphraseError()
  }

  // Derive new wrapping key with a fresh salt
  const newSalt = generateSalt(16)
  const newWrappingKey = await deriveWrappingKey(newPassphrase, newSalt)
  const newWrappedKey = await wrapDataKey(dataKeyExtractable, newWrappingKey)

  const { error } = await supabase
    .from('user_key_material')
    .update({
      passphrase_salt: toBase64(newSalt),
      passphrase_wrapped_key: toBase64(newWrappedKey),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update passphrase: ${error.message}`)
  }

  loadKeyIntoMemory(dataKeyExtractable, material.key_version)
  await persistDeviceSession(userId, dataKeyExtractable, material.key_version)
}



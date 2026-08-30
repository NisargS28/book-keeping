"use client"

/**
 * lib/encryption/index.ts
 *
 * Public API for the client-side encryption layer.
 * Import from '@/lib/encryption' throughout the application.
 */

// Crypto primitives (AES-256-GCM + PBKDF2 + AES-KW)
export {
  toBase64,
  fromBase64,
  generateSalt,
  generateIV,
  deriveWrappingKey,
  generateDataKey,
  wrapDataKey,
  unwrapDataKey,
  encryptRecord,
  decryptRecord,
} from './crypto'

// In-memory key lifecycle
export {
  isUnlocked,
  getDataKey,
  getKeyVersion,
  clearDataKey,
  persistDeviceSession,
  tryAutoUnlock,
  setupEncryption,
  unlockWithPassphrase,
  unlockWithRecoverySecret,
  regenerateRecoverySecret,
  changeEncryptionPassphrase,
  hasEncryptionSetup,
  EncryptionLockedError,
  IncorrectPassphraseError,
  InvalidRecoverySecretError,
} from './key-manager'

// Types
export type {
  EncryptedPayload,
  EncryptionAAD,
  EncryptedBookRecord,
  EncryptedCategoryRecord,
  EncryptedEntryRecord,
  UserKeyMaterialRow,
  PlaintextBookPayload,
  PlaintextCategoryPayload,
  PlaintextEntryPayload,
} from './types'

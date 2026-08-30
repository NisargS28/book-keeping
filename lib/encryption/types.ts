"use client"

/**
 * Encryption types for the client-side AES-256-GCM zero-knowledge architecture.
 *
 * Two algorithm domains are kept strictly separate:
 *   AES-KW  — wrapping / unwrapping the random data key only
 *   AES-GCM — encrypting application records only
 *
 * AAD (Additional Authenticated Data) is NEVER read from the stored payload
 * for decryption. It is always reconstructed from trusted application context
 * and passed to AES-GCM, so any ciphertext moved to a different record/book/user
 * causes authentication failure.
 */

// ── Payload stored in Supabase encrypted_data column ────────────────────────

/**
 * Serialised encrypted payload.
 * Stored as JSON string in the `encrypted_data` column.
 *
 * Does NOT contain a stored aad field.
 * AAD is always reconstructed from trusted context on decrypt.
 */
export interface EncryptedPayload {
  /** Format version — governs the cipher + AAD serialisation scheme. */
  fv: number
  /** Key version — identifies which wrapping of the data key was active. */
  kv: number
  /** Base64-encoded 12-byte random IV. Each encryption uses a fresh IV. */
  iv: string
  /** Base64-encoded AES-256-GCM ciphertext + 128-bit authentication tag. */
  ct: string
}

// ── Additional Authenticated Data context ────────────────────────────────────

/**
 * Context bound to every ciphertext via AES-GCM additionalData.
 *
 * On ENCRYPT: serialised deterministically and passed as additionalData.
 * On DECRYPT: reconstructed from TRUSTED sources and passed as additionalData.
 *   - userId   → authenticated Supabase session (auth.uid())
 *   - bookId   → DB row book_id column
 *   - recordId → DB row id column
 *   - fv / kv  → payload.fv / payload.kv fields
 *
 * Moving a ciphertext to a different record/book/user causes AAD mismatch
 * → AES-GCM authentication tag fails → decryptRecord() throws.
 */
export interface EncryptionAAD {
  userId: string
  bookId: string
  recordId: string
  fv: number
  kv: number
}

// ── Raw DB row shapes (contain no plaintext private fields) ──────────────────

export interface EncryptedBookRecord {
  id: string
  user_id: string
  encrypted_data: string       // JSON-serialised EncryptedPayload
  encryption_version: number
  created_at: string
  updated_at: string
}

export interface EncryptedCategoryRecord {
  id: string
  book_id: string
  encrypted_data: string
  encryption_version: number
  created_at: string
}

export interface EncryptedEntryRecord {
  id: string
  book_id: string
  encrypted_data: string
  encryption_version: number
  created_at: string
  updated_at: string
}

/**
 * user_key_material DB row.
 * Contains only WRAPPED key material — never the raw data key.
 * The recovery secret itself is never stored; only the recovery-wrapped key is.
 */
export interface UserKeyMaterialRow {
  /** Equals the user's auth UUID. */
  id: string
  /** Base64 — random PBKDF2 salt for passphrase-derived wrapping key. */
  passphrase_salt: string
  /** Base64 — data key wrapped with passphrase-derived AES-KW key. */
  passphrase_wrapped_key: string
  /** Base64 — separate random PBKDF2 salt for recovery-derived wrapping key. */
  recovery_key_salt: string
  /** Base64 — data key wrapped with recovery-derived AES-KW key. */
  recovery_wrapped_key: string
  /** Incremented on key rotation. */
  key_version: number
  created_at: string
  updated_at: string
}

// ── Plaintext (decrypted) payload shapes ─────────────────────────────────────
// These match the JSON objects that live inside EncryptedPayload.ct after decrypt.

export interface PlaintextBookPayload {
  name: string
  description?: string
  currency: string
}

export interface PlaintextCategoryPayload {
  name: string
  color?: string
}

export interface PlaintextEntryPayload {
  categoryId: string
  type: 'income' | 'expense'
  amount: number
  description: string
  people?: string | null
  paymentMode?: string | null
  date: string
  occurredAt: string
  notes?: string
}

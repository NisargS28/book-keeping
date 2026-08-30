/**
 * lib/types.ts
 *
 * Application-level types. All types here represent DECRYPTED, in-memory data
 * that has already been decrypted on the client. These types must never be used
 * as shapes for Supabase insert/update payloads (use EncryptedEntryRecord etc. for that).
 */

// ── Non-sensitive auth / profile types ───────────────────────────────────────

export interface User {
  id: string
  email: string
  displayName: string
  profileImage?: string
  createdAt: string
}

export interface UserProfile {
  id: string
  userId: string
  displayName: string
  profileImage?: string
  bio?: string
  updatedAt: string
}

// ── Decrypted application types ───────────────────────────────────────────────
// These exist only in browser memory after decryption.
// They are NEVER written to Supabase as plaintext.

/**
 * A decrypted book record. Exists in browser memory only.
 * The `balance` field is computed client-side from decrypted entries.
 */
export interface DecryptedBook {
  id: string
  userId: string
  name: string
  description?: string
  currency: string
  balance: number        // computed client-side, never stored
  createdAt: string
  updatedAt: string
}

/**
 * A decrypted category record. Exists in browser memory only.
 */
export interface DecryptedCategory {
  id: string
  bookId: string
  name: string
  color?: string
  createdAt: string
}

/**
 * A decrypted entry record. Exists in browser memory only.
 * The `runningBalance` field is computed client-side from ordered entries.
 */
export interface DecryptedEntry {
  id: string
  bookId: string
  categoryId: string
  people?: string | null
  type: 'income' | 'expense'
  amount: number
  description: string
  paymentMode: string | null
  date: string
  occurredAt: string
  notes?: string
  runningBalance: number  // computed client-side, never stored
  createdAt: string
  updatedAt: string
}

// ── Backward-compatible aliases ───────────────────────────────────────────────
// Existing imports of Book, Category, Entry continue to work during migration.

/** @deprecated Use DecryptedBook */
export type Book = DecryptedBook

/** @deprecated Use DecryptedCategory */
export type Category = DecryptedCategory

/** @deprecated Use DecryptedEntry */
export type Entry = DecryptedEntry

// ── Aggregated summary (always computed client-side) ─────────────────────────

export interface BookSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  entryCount: number
  lastUpdated: string
}

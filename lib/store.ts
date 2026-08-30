"use client"

/**
 * lib/store.ts
 *
 * All Supabase CRUD operations for books, categories, and entries.
 *
 * Security contract:
 *   - Every INSERT / UPDATE sends only encrypted_data to Supabase.
 *     No plaintext private field (name, description, currency, amount, type,
 *     description, people, payment_mode, date, occurred_at, category_id, notes,
 *     color) is ever written to the database.
 *   - Every SELECT result is decrypted on the client before being returned.
 *   - Encryption failure (encryptRecord throws) aborts the operation and
 *     propagates the error. There is NO fallback to plaintext storage.
 *   - Decryption failure propagates; partial/corrupted records are not silently
 *     omitted with dummy data.
 *   - console.log calls do not output any private field values.
 */

import { supabase } from './supabase'
import {
  encryptRecord,
  decryptRecord,
  getDataKey,
  getKeyVersion,
} from './encryption'
import type {
  EncryptedPayload,
  EncryptionAAD,
  EncryptedBookRecord,
  EncryptedCategoryRecord,
  EncryptedEntryRecord,
  PlaintextBookPayload,
  PlaintextCategoryPayload,
  PlaintextEntryPayload,
} from './encryption'
import type {
  DecryptedBook,
  DecryptedCategory,
  DecryptedEntry,
} from './types'

// Re-export decrypted types under their legacy names for backward compatibility
export type { DecryptedBook as Book, DecryptedCategory as Category, DecryptedEntry as Entry }
export type { DecryptedBook, DecryptedCategory, DecryptedEntry }

const ACTIVE_BOOK_KEY = 'cashbook_active_book'
const FORMAT_VERSION = 1 as const

function notifyDataChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cashbook:data-changed'))
  }
}

// ── AAD builders ──────────────────────────────────────────────────────────────
// AAD is always constructed from trusted context (DB row fields + auth session).
// It is NEVER read from the stored payload.

function bookAAD(userId: string, bookId: string): EncryptionAAD {
  return { userId, bookId, recordId: bookId, fv: FORMAT_VERSION, kv: getKeyVersion() }
}

function categoryAAD(userId: string, bookId: string, categoryId: string): EncryptionAAD {
  return { userId, bookId, recordId: categoryId, fv: FORMAT_VERSION, kv: getKeyVersion() }
}

function entryAAD(userId: string, bookId: string, entryId: string, kv?: number): EncryptionAAD {
  return { userId, bookId, recordId: entryId, fv: FORMAT_VERSION, kv: kv ?? getKeyVersion() }
}

// ── Active book (unencrypted — only an ID) ────────────────────────────────────

export function getActiveBookId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACTIVE_BOOK_KEY)
}

export function setActiveBookId(bookId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_BOOK_KEY, bookId)
}

// ── BOOKS ─────────────────────────────────────────────────────────────────────

export async function getBooks(userId: string): Promise<DecryptedBook[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching books:', error.message)
    throw error
  }

  const rows = (data ?? []) as EncryptedBookRecord[]

  const books = await Promise.all(rows.map(async (row) => {
    const payload: EncryptedPayload = JSON.parse(row.encrypted_data)
    const aad = bookAAD(userId, row.id)
    const plain = await decryptRecord(payload, getDataKey(), aad) as PlaintextBookPayload

    // Balance is computed client-side from decrypted entries
    const entries = await getEntries(row.id, userId)
    const balance = entries.reduce((sum, e) =>
      sum + (e.type === 'income' ? e.amount : -e.amount), 0)

    return {
      id: row.id,
      userId: row.user_id,
      name: plain.name,
      description: plain.description,
      currency: plain.currency,
      balance,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    } satisfies DecryptedBook
  }))

  console.log(`Fetched ${books.length} books`)
  return books
}

export async function getBook(id: string, userId: string): Promise<DecryptedBook | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching book:', error.message)
    return null
  }
  if (!data) return null

  const row = data as EncryptedBookRecord
  const payload: EncryptedPayload = JSON.parse(row.encrypted_data)
  const aad = bookAAD(userId, row.id)
  const plain = await decryptRecord(payload, getDataKey(), aad) as PlaintextBookPayload

  const entries = await getEntries(row.id, userId)
  const balance = entries.reduce((sum, e) =>
    sum + (e.type === 'income' ? e.amount : -e.amount), 0)

  return {
    id: row.id,
    userId: row.user_id,
    name: plain.name,
    description: plain.description,
    currency: plain.currency,
    balance,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createBook(
  userId: string,
  name: string,
  currency = 'INR',
  description?: string,
): Promise<DecryptedBook> {
  // Generate the ID client-side so it can be bound into the AAD before the INSERT.
  const bookId = crypto.randomUUID()
  const plaintext: PlaintextBookPayload = { name, currency, description }
  const aad = bookAAD(userId, bookId)

  // Encrypt — throws on failure; no fallback to plaintext.
  const payload = await encryptRecord(plaintext, getDataKey(), aad)

  const { data, error } = await supabase
    .from('books')
    .insert([{
      id: bookId,
      user_id: userId,
      encrypted_data: JSON.stringify(payload),
      encryption_version: FORMAT_VERSION,
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating book:', error.message)
    throw error
  }

  console.log('Book created')
  notifyDataChange()

  return {
    id: data.id,
    userId: data.user_id,
    name,
    description,
    currency,
    balance: 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateBook(
  id: string,
  userId: string,
  updates: Partial<Pick<DecryptedBook, 'name' | 'description' | 'currency'>>,
): Promise<DecryptedBook | null> {
  // Fetch current encrypted state
  const current = await getBook(id, userId)
  if (!current) return null

  // Merge updates with current plaintext (decrypted in getBook)
  const plaintext: PlaintextBookPayload = {
    name: updates.name ?? current.name,
    description: updates.description ?? current.description,
    currency: updates.currency ?? current.currency,
  }
  const aad = bookAAD(userId, id)

  // Re-encrypt merged state — throws on failure; no fallback.
  const payload = await encryptRecord(plaintext, getDataKey(), aad)

  const { data, error } = await supabase
    .from('books')
    .update({
      encrypted_data: JSON.stringify(payload),
      encryption_version: FORMAT_VERSION,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating book:', error.message)
    return null
  }

  console.log('Book updated')
  notifyDataChange()

  return {
    id: data.id,
    userId: data.user_id,
    name: plaintext.name,
    description: plaintext.description,
    currency: plaintext.currency,
    balance: current.balance,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id)

  if (error) {
    console.error('Error deleting book:', error.message)
    throw error
  }

  console.log('Book deleted')
  notifyDataChange()
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────

export async function getCategories(bookId: string, userId: string): Promise<DecryptedCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error.message)
    throw error
  }

  const rows = (data ?? []) as EncryptedCategoryRecord[]

  const categories = await Promise.all(rows.map(async (row) => {
    const payload: EncryptedPayload = JSON.parse(row.encrypted_data)
    const aad = categoryAAD(userId, bookId, row.id)
    const plain = await decryptRecord(payload, getDataKey(), aad) as PlaintextCategoryPayload

    return {
      id: row.id,
      bookId: row.book_id,
      name: plain.name,
      color: plain.color,
      createdAt: row.created_at,
    } satisfies DecryptedCategory
  }))

  console.log(`Fetched ${categories.length} categories`)
  return categories
}

export async function createCategory(
  category: { bookId: string; name: string; color: string },
  userId: string,
): Promise<DecryptedCategory> {
  const categoryId = crypto.randomUUID()
  const plaintext: PlaintextCategoryPayload = { name: category.name, color: category.color }
  const aad = categoryAAD(userId, category.bookId, categoryId)

  // Encrypt — throws on failure; no fallback.
  const payload = await encryptRecord(plaintext, getDataKey(), aad)

  const { data, error } = await supabase
    .from('categories')
    .insert([{
      id: categoryId,
      book_id: category.bookId,
      encrypted_data: JSON.stringify(payload),
      encryption_version: FORMAT_VERSION,
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error.message)
    throw error
  }

  console.log('Category created')
  notifyDataChange()

  return {
    id: data.id,
    bookId: data.book_id,
    name: category.name,
    color: category.color,
    createdAt: data.created_at,
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) {
    console.error('Error deleting category:', error.message)
    throw error
  }

  console.log('Category deleted')
  notifyDataChange()
}

// ── ENTRIES ───────────────────────────────────────────────────────────────────

export async function getEntries(bookId: string, userId: string): Promise<DecryptedEntry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('book_id', bookId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching entries:', error.message)
    throw error
  }

  const rows = (data ?? []) as EncryptedEntryRecord[]

  // Decrypt all rows
  const decrypted = await Promise.all(rows.map(async (row) => {
    const payload: EncryptedPayload = JSON.parse(row.encrypted_data)
    // AAD is reconstructed from trusted DB row context — kv comes from the payload
    const aad = entryAAD(userId, bookId, row.id, payload.kv)
    const plain = await decryptRecord(payload, getDataKey(), aad) as PlaintextEntryPayload

    return {
      _raw: row,
      plain,
    }
  }))

  // Sort chronologically by occurredAt (client-side) to compute correct running balance
  const sorted = decrypted.slice().sort((a, b) => {
    const tA = new Date(a.plain.occurredAt || a._raw.created_at).getTime()
    const tB = new Date(b.plain.occurredAt || b._raw.created_at).getTime()
    return tA - tB
  })

  // Compute running balance client-side
  let runningBalance = 0
  const withBalance: DecryptedEntry[] = sorted.map(({ _raw, plain }) => {
    runningBalance += plain.type === 'income' ? plain.amount : -plain.amount

    return {
      id: _raw.id,
      bookId: _raw.book_id,
      categoryId: plain.categoryId,
      people: plain.people ?? null,
      type: plain.type,
      amount: plain.amount,
      description: plain.description,
      paymentMode: plain.paymentMode ?? null,
      date: plain.date,
      occurredAt: plain.occurredAt,
      notes: plain.notes,
      runningBalance,
      createdAt: _raw.created_at,
      updatedAt: _raw.updated_at,
    } satisfies DecryptedEntry
  })

  console.log(`Fetched and decrypted ${withBalance.length} entries`)

  // Return newest first (reverse chronological for UI display)
  return withBalance.reverse()
}

export async function getEntry(
  id: string,
  bookId: string,
  userId: string,
): Promise<DecryptedEntry | null> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching entry:', error.message)
    return null
  }
  if (!data) return null

  const row = data as EncryptedEntryRecord
  const payload: EncryptedPayload = JSON.parse(row.encrypted_data)
  const aad = entryAAD(userId, bookId, row.id, payload.kv)
  const plain = await decryptRecord(payload, getDataKey(), aad) as PlaintextEntryPayload

  return {
    id: row.id,
    bookId: row.book_id,
    categoryId: plain.categoryId,
    people: plain.people ?? null,
    type: plain.type,
    amount: plain.amount,
    description: plain.description,
    paymentMode: plain.paymentMode ?? null,
    date: plain.date,
    occurredAt: plain.occurredAt,
    notes: plain.notes,
    runningBalance: 0,  // computed in getEntries
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function createEntry(
  entry: {
    bookId: string
    userId: string
    categoryId: string
    type: 'income' | 'expense'
    amount: number
    description: string
    people?: string | null
    paymentMode?: string | null
    date: string
    occurredAt?: string
    notes?: string
  },
): Promise<DecryptedEntry> {
  const entryId = crypto.randomUUID()
  const occurredAt = entry.occurredAt ?? new Date().toISOString()
  const date = entry.date || occurredAt.split('T')[0]

  const plaintext: PlaintextEntryPayload = {
    categoryId: entry.categoryId,
    type: entry.type,
    amount: entry.amount,
    description: entry.description,
    people: entry.people ?? null,
    paymentMode: entry.paymentMode ?? null,
    date,
    occurredAt,
    notes: entry.notes,
  }

  const aad = entryAAD(entry.userId, entry.bookId, entryId)

  // Encrypt — throws on failure; no fallback to plaintext.
  const payload = await encryptRecord(plaintext, getDataKey(), aad)

  const { data, error } = await supabase
    .from('entries')
    .insert([{
      id: entryId,
      book_id: entry.bookId,
      encrypted_data: JSON.stringify(payload),
      encryption_version: FORMAT_VERSION,
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating entry:', error.message)
    throw new Error(error.message || 'Failed to create entry')
  }

  console.log('Entry created')
  notifyDataChange()

  return {
    id: data.id,
    bookId: data.book_id,
    categoryId: plaintext.categoryId,
    people: plaintext.people ?? null,
    type: plaintext.type,
    amount: plaintext.amount,
    description: plaintext.description,
    paymentMode: plaintext.paymentMode ?? null,
    date: plaintext.date,
    occurredAt: plaintext.occurredAt,
    notes: plaintext.notes,
    runningBalance: 0,   // computed in getEntries
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateEntry(
  id: string,
  bookId: string,
  userId: string,
  updates: Partial<Omit<PlaintextEntryPayload, 'occurredAt'> & { occurredAt?: string }>,
): Promise<DecryptedEntry | null> {
  // Fetch and decrypt the current entry
  const current = await getEntry(id, bookId, userId)
  if (!current) return null

  // Merge updates with current decrypted state
  const plaintext: PlaintextEntryPayload = {
    categoryId: updates.categoryId ?? current.categoryId,
    type: updates.type ?? current.type,
    amount: updates.amount ?? current.amount,
    description: updates.description ?? current.description,
    people: updates.people !== undefined ? updates.people : current.people,
    paymentMode: updates.paymentMode !== undefined ? updates.paymentMode : current.paymentMode,
    date: updates.date ?? current.date,
    occurredAt: updates.occurredAt ?? current.occurredAt,
    notes: updates.notes !== undefined ? updates.notes : current.notes,
  }

  // Re-encrypt merged state — throws on failure; no fallback.
  const aad = entryAAD(userId, bookId, id)
  const payload = await encryptRecord(plaintext, getDataKey(), aad)

  const { data, error } = await supabase
    .from('entries')
    .update({
      encrypted_data: JSON.stringify(payload),
      encryption_version: FORMAT_VERSION,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating entry:', error.message)
    return null
  }

  console.log('Entry updated')
  notifyDataChange()

  return {
    id: data.id,
    bookId: data.book_id,
    categoryId: plaintext.categoryId,
    people: plaintext.people ?? null,
    type: plaintext.type,
    amount: plaintext.amount,
    description: plaintext.description,
    paymentMode: plaintext.paymentMode ?? null,
    date: plaintext.date,
    occurredAt: plaintext.occurredAt,
    notes: plaintext.notes,
    runningBalance: 0,   // computed in getEntries
    createdAt: current.createdAt,
    updatedAt: data.updated_at,
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', id)

  if (error) {
    console.error('Error deleting entry:', error.message)
    throw error
  }

  console.log('Entry deleted')
  notifyDataChange()
}

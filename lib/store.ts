"use client"

import { supabase } from './supabase'
import type { Book, Category, Entry } from "./types"

// Re-export types for convenience
export type { Book, Category, Entry } from "./types"

const ACTIVE_BOOK_KEY = "cashbook_active_book"

function notifyDataChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cashbook:data-changed"))
  }
}

// ===== BOOKS =====

export async function getBooks(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  console.log('📚 getBooks:', { userId, count: data?.length, error })
  if (error) {
    console.error('Error fetching books:', error)
    throw error
  }
  
  // Map snake_case to camelCase and calculate balance for each
  const books = await Promise.all((data || []).map(async book => {
    // Calculate balance from entries
    const entries = await getEntries(book.id)
    console.log(`📊 Book "${book.name}" has ${entries.length} entries`)
    const balance = entries.reduce((sum, entry) => {
      return sum + (entry.type === 'income' ? entry.amount : -entry.amount)
    }, 0)
    console.log(`💰 Book "${book.name}" calculated balance: ${balance}`)

    return {
      id: book.id,
      userId: book.user_id,
      name: book.name,
      description: book.description,
      currency: book.currency,
      balance,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
    }
  }))

  return books
}

export async function getBook(id: string): Promise<Book | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  console.log('📖 getBook:', { id, found: !!data, error })
  if (error) {
    console.error('Error fetching book:', error)
    return null
  }

  if (!data) return null

  // Calculate balance from entries
  const entries = await getEntries(id)
  const balance = entries.reduce((sum, entry) => {
    return sum + (entry.type === 'income' ? entry.amount : -entry.amount)
  }, 0)

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    currency: data.currency,
    balance,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function createBook(userId: string, name: string, currency: string = 'INR', description?: string): Promise<Book> {
  const { data, error } = await supabase
    .from('books')
    .insert([{ 
      user_id: userId, 
      name, 
      currency,
      description: description || null
    }])
    .select()
    .single()

  console.log('✅ createBook:', { userId, name, description, data, error })
  if (error) {
    console.error('Error creating book:', error)
    throw error
  }

  notifyDataChange()

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    currency: data.currency,
    balance: 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
  const updateData: any = {}
  if (updates.name !== undefined) updateData.name = updates.name
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.currency !== undefined) updateData.currency = updates.currency
  // Note: balance is calculated from entries, not stored
  
  updateData.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('books')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  console.log('✏️ updateBook:', { id, updates, data, error })
  if (error) {
    console.error('Error updating book:', error)
    return null
  }

  notifyDataChange()

  if (!data) return null

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    currency: data.currency,
    balance: 0, // Will be calculated from entries
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', id)

  console.log('🗑️ deleteBook:', { id, error })
  if (error) {
    console.error('Error deleting book:', error)
    throw error
  }

  notifyDataChange()
}

// ===== ACTIVE BOOK =====

export function getActiveBookId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACTIVE_BOOK_KEY)
}

export function setActiveBookId(bookId: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(ACTIVE_BOOK_KEY, bookId)
}

// ===== CATEGORIES =====

export async function getCategories(bookId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('book_id', bookId)
    .order('name', { ascending: true })

  console.log('🏷️ getCategories:', { bookId, count: data?.length, error })
  if (error) {
    console.error('Error fetching categories:', error)
    throw error
  }

  return (data || []).map(cat => ({
    id: cat.id,
    bookId: cat.book_id,
    name: cat.name,
    color: cat.color,
    createdAt: cat.created_at,
  }))
}

export async function createCategory(category: { bookId: string; name: string; color: string }): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ 
      book_id: category.bookId, 
      name: category.name, 
      color: category.color 
    }])
    .select()
    .single()

  console.log('✨ createCategory:', { category, data, error })
  if (error) {
    console.error('Error creating category:', error)
    throw error
  }

  notifyDataChange()

  return {
    id: data.id,
    bookId: data.book_id,
    name: data.name,
    color: data.color,
    createdAt: data.created_at,
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  console.log('🗑️ deleteCategory:', { id, error })
  if (error) {
    console.error('Error deleting category:', error)
    throw error
  }

  notifyDataChange()
}

// ===== ENTRIES =====

export async function getEntries(bookId: string): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('book_id', bookId)
    .order('occurred_at', { ascending: true, nullsFirst: false })
    .order('date', { ascending: true })
    .order('created_at', { ascending: true })

  console.log('💰 getEntries:', { bookId, count: data?.length, error })
  if (error) {
    console.error('Error fetching entries:', error)
    throw error
  }

  // Sort chronologically by occurred_at (or fallback to date/created_at) to guarantee accurate running balance
  const sortedData = (data || []).slice().sort((a, b) => {
    const timeA = new Date(a.occurred_at || a.created_at || a.date).getTime()
    const timeB = new Date(b.occurred_at || b.created_at || b.date).getTime()
    return timeA - timeB
  })

  // Calculate running balance (chronologically)
  let runningBalance = 0
  const entriesWithBalance = sortedData.map(entry => {
    const amount = entry.type === 'income' ? entry.amount : -entry.amount
    runningBalance += amount

    return {
      id: entry.id,
      bookId: entry.book_id,
      categoryId: entry.category_id,
      people: entry.people,
      description: entry.description,
      amount: entry.amount,
      type: entry.type as 'income' | 'expense',
      paymentMode: entry.payment_mode,
      date: entry.date,
      occurredAt: entry.occurred_at || entry.created_at || (entry.date ? `${entry.date}T00:00:00.000Z` : new Date().toISOString()),
      runningBalance: runningBalance,
      createdAt: entry.created_at,
      updatedAt: entry.updated_at,
    }
  })

  // Return in reverse chronological order (newest first) but with correct running balances
  return entriesWithBalance.reverse()
}

export async function getEntry(id: string): Promise<Entry | null> {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', id)
    .single()

  console.log('📄 getEntry:', { id, found: !!data, error })
  if (error) {
    console.error('Error fetching entry:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    bookId: data.book_id,
    categoryId: data.category_id,
    people: data.people,
    description: data.description,
    amount: data.amount,
    type: data.type as 'income' | 'expense',
    paymentMode: data.payment_mode,
    date: data.date,
    occurredAt: data.occurred_at || data.created_at || (data.date ? `${data.date}T00:00:00.000Z` : new Date().toISOString()),
    runningBalance: 0, // Not stored in DB
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function createEntry(entry: Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'runningBalance' | 'occurredAt'> & { occurredAt?: string }): Promise<Entry> {
  const occurredAt = entry.occurredAt || new Date().toISOString()
  const date = entry.date || occurredAt.split('T')[0]

  console.log('📝 Creating entry with data:', {
    book_id: entry.bookId,
    category_id: entry.categoryId,
    people: entry.people || null,
    description: entry.description,
    amount: entry.amount,
    type: entry.type,
    payment_mode: entry.paymentMode,
    date: date,
    occurred_at: occurredAt,
  })

  const { data, error } = await supabase
    .from('entries')
    .insert([{
      book_id: entry.bookId,
      category_id: entry.categoryId,
      people: entry.people || null,
      description: entry.description,
      amount: entry.amount,
      type: entry.type,
      payment_mode: entry.paymentMode,
      date: date,
      occurred_at: occurredAt,
    }])
    .select()
    .single()

  console.log('💸 createEntry response:', { data, error, hasError: !!error })
  
  if (error) {
    console.error('Error creating entry:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fullError: JSON.stringify(error)
    })
    throw new Error(error.message || 'Failed to create entry')
  }

  notifyDataChange()

  if (!data) {
    throw new Error('No data returned from create entry')
  }

  return {
    id: data.id,
    bookId: data.book_id,
    categoryId: data.category_id,
    people: data.people,
    description: data.description,
    amount: data.amount,
    type: data.type as 'income' | 'expense',
    paymentMode: data.payment_mode,
    date: data.date,
    occurredAt: data.occurred_at || occurredAt,
    runningBalance: 0, // Not stored in DB
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateEntry(id: string, updates: Partial<Entry>): Promise<Entry | null> {
  const updateData: any = { updated_at: new Date().toISOString() }
  
  if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId
  if (updates.people !== undefined) updateData.people = updates.people || null
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.amount !== undefined) updateData.amount = updates.amount
  if (updates.type !== undefined) updateData.type = updates.type
  if (updates.paymentMode !== undefined) updateData.payment_mode = updates.paymentMode
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.occurredAt !== undefined) {
    updateData.occurred_at = updates.occurredAt
    updateData.date = updates.occurredAt.split('T')[0]
  }

  const { data, error } = await supabase
    .from('entries')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  console.log('✏️ updateEntry:', { id, updates, data, error })
  if (error) {
    console.error('Error updating entry:', error)
    return null
  }

  notifyDataChange()

  if (!data) return null

  return {
    id: data.id,
    bookId: data.book_id,
    categoryId: data.category_id,
    people: data.people,
    description: data.description,
    amount: data.amount,
    type: data.type as 'income' | 'expense',
    paymentMode: data.payment_mode,
    date: data.date,
    occurredAt: data.occurred_at || updates.occurredAt || data.created_at || data.date,
    runningBalance: 0, // Not stored in DB
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)

  console.log('🗑️ deleteEntry:', { id, error })
  if (error) {
    console.error('Error deleting entry:', error)
    throw error
  }

  notifyDataChange()
}

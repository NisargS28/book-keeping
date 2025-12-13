"use client"

// TODO: Replace with Supabase queries and real-time subscriptions

import type { Book, Category, Entry } from "./types"
import mockBooks from "@/data/mock-books.json"
import mockCategories from "@/data/mock-categories.json"
import mockEntries from "@/data/mock-entries.json"

const BOOKS_KEY = "cashbook_books"
const CATEGORIES_KEY = "cashbook_categories"
const ENTRIES_KEY = "cashbook_entries"
const ACTIVE_BOOK_KEY = "cashbook_active_book"

// Initialize data
function initializeData() {
  if (typeof window === "undefined") return

  if (!localStorage.getItem(BOOKS_KEY)) {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(mockBooks))
  }
  if (!localStorage.getItem(CATEGORIES_KEY)) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(mockCategories))
  }
  if (!localStorage.getItem(ENTRIES_KEY)) {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(mockEntries))
  }
}

// Books
export function getBooks(userId: string): Book[] {
  initializeData()
  const stored = localStorage.getItem(BOOKS_KEY)
  const books: Book[] = stored ? JSON.parse(stored) : []
  return books.filter((b) => b.userId === userId)
}

export function getBook(id: string): Book | null {
  const stored = localStorage.getItem(BOOKS_KEY)
  const books: Book[] = stored ? JSON.parse(stored) : []
  return books.find((b) => b.id === id) || null
}

export function createBook(book: Omit<Book, "id" | "createdAt" | "updatedAt" | "balance">): Book {
  const stored = localStorage.getItem(BOOKS_KEY)
  const books: Book[] = stored ? JSON.parse(stored) : []

  const newBook: Book = {
    ...book,
    id: `book-${Date.now()}`,
    balance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  books.push(newBook)
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books))
  return newBook
}

export function updateBook(id: string, updates: Partial<Book>): Book | null {
  const stored = localStorage.getItem(BOOKS_KEY)
  const books: Book[] = stored ? JSON.parse(stored) : []
  const index = books.findIndex((b) => b.id === id)

  if (index === -1) return null

  books[index] = {
    ...books[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(BOOKS_KEY, JSON.stringify(books))
  return books[index]
}

export function deleteBook(id: string) {
  const stored = localStorage.getItem(BOOKS_KEY)
  const books: Book[] = stored ? JSON.parse(stored) : []
  const filtered = books.filter((b) => b.id !== id)
  localStorage.setItem(BOOKS_KEY, JSON.stringify(filtered))

  // Also delete related data
  const categories = getCategories(id)
  const entries = getEntries(id)

  categories.forEach((c) => deleteCategory(c.id))
  entries.forEach((e) => deleteEntry(e.id))
}

// Active Book
export function getActiveBookId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACTIVE_BOOK_KEY)
}

export function setActiveBookId(bookId: string) {
  localStorage.setItem(ACTIVE_BOOK_KEY, bookId)
}

// Categories
export function getCategories(bookId: string): Category[] {
  const stored = localStorage.getItem(CATEGORIES_KEY)
  const categories: Category[] = stored ? JSON.parse(stored) : []
  return categories.filter((c) => c.bookId === bookId)
}

export function createCategory(category: Omit<Category, "id" | "createdAt">): Category {
  const stored = localStorage.getItem(CATEGORIES_KEY)
  const categories: Category[] = stored ? JSON.parse(stored) : []

  const newCategory: Category = {
    ...category,
    id: `cat-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }

  categories.push(newCategory)
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  return newCategory
}

export function deleteCategory(id: string) {
  const stored = localStorage.getItem(CATEGORIES_KEY)
  const categories: Category[] = stored ? JSON.parse(stored) : []
  const filtered = categories.filter((c) => c.id !== id)
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered))
}

// Entries
export function getEntries(bookId: string): Entry[] {
  const stored = localStorage.getItem(ENTRIES_KEY)
  const entries: Entry[] = stored ? JSON.parse(stored) : []
  return entries
    .filter((e) => e.bookId === bookId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getEntry(id: string): Entry | null {
  const stored = localStorage.getItem(ENTRIES_KEY)
  const entries: Entry[] = stored ? JSON.parse(stored) : []
  return entries.find((e) => e.id === id) || null
}

function recalculateBalances(bookId: string) {
  const stored = localStorage.getItem(ENTRIES_KEY)
  const entries: Entry[] = stored ? JSON.parse(stored) : []

  const bookEntries = entries
    .filter((e) => e.bookId === bookId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let runningBalance = 0
  bookEntries.forEach((entry) => {
    runningBalance += entry.type === "income" ? entry.amount : -entry.amount
    entry.runningBalance = runningBalance
  })

  const allEntries = entries.map((e) => {
    const updated = bookEntries.find((be) => be.id === e.id)
    return updated || e
  })

  localStorage.setItem(ENTRIES_KEY, JSON.stringify(allEntries))

  // Update book balance
  updateBook(bookId, { balance: runningBalance })
}

export function createEntry(entry: Omit<Entry, "id" | "createdAt" | "updatedAt" | "runningBalance">): Entry {
  const stored = localStorage.getItem(ENTRIES_KEY)
  const entries: Entry[] = stored ? JSON.parse(stored) : []

  const newEntry: Entry = {
    ...entry,
    id: `entry-${Date.now()}`,
    runningBalance: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  entries.push(newEntry)
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))

  recalculateBalances(entry.bookId)

  return getEntry(newEntry.id)!
}

export function updateEntry(id: string, updates: Partial<Entry>): Entry | null {
  const stored = localStorage.getItem(ENTRIES_KEY)
  const entries: Entry[] = stored ? JSON.parse(stored) : []
  const index = entries.findIndex((e) => e.id === id)

  if (index === -1) return null

  const oldEntry = entries[index]
  entries[index] = {
    ...oldEntry,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))

  recalculateBalances(oldEntry.bookId)

  return getEntry(id)
}

export function deleteEntry(id: string) {
  const stored = localStorage.getItem(ENTRIES_KEY)
  const entries: Entry[] = stored ? JSON.parse(stored) : []
  const entry = entries.find((e) => e.id === id)

  if (!entry) return

  const filtered = entries.filter((e) => e.id !== id)
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered))

  recalculateBalances(entry.bookId)
}

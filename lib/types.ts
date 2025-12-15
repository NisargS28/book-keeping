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

export interface Book {
  id: string
  userId: string
  name: string
  description?: string
  currency: string
  balance: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  bookId: string
  name: string
  color?: string
  createdAt: string
}

export interface Entry {
  id: string
  bookId: string
  categoryId: string
  type: "income" | "expense"
  amount: number
  description: string
  paymentMode: string | null
  date: string
  notes?: string
  runningBalance: number
  createdAt: string
  updatedAt: string
}

export interface BookSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  entryCount: number
  lastUpdated: string
}

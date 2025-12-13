export interface User {
  id: string
  email: string
  name: string
  createdAt: string
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
  type: "income" | "expense"
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
  paymentMode: string
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

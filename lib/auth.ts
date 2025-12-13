"use client"

// TODO: Replace with Supabase authentication

import type { User } from "./types"

const AUTH_KEY = "cashbook_auth_user"
const USERS_KEY = "cashbook_users"

export function getStoredUsers(): User[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(USERS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveUser(user: User) {
  const users = getStoredUsers()
  const existingIndex = users.findIndex((u) => u.email === user.email)

  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function signup(email: string, password: string, name: string): { user?: User; error?: string } {
  const users = getStoredUsers()

  if (users.find((u) => u.email === email)) {
    return { error: "Email already exists" }
  }

  const user: User = {
    id: `user-${Date.now()}`,
    email,
    name,
    createdAt: new Date().toISOString(),
  }

  saveUser(user)
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))

  return { user }
}

export function login(email: string, password: string): { user?: User; error?: string } {
  const users = getStoredUsers()
  const user = users.find((u) => u.email === email)

  if (!user) {
    return { error: "Invalid email or password" }
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  return { user }
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(AUTH_KEY)
  return stored ? JSON.parse(stored) : null
}

"use client"

/**
 * components/encryption-provider.tsx
 *
 * React context that manages the encryption lock/unlock lifecycle.
 * Distinct from auth state — a user can be authenticated (Supabase session valid)
 * but have encryption locked (no data key in memory).
 *
 * State machine:
 *   loading → tryAutoUnlock (device session) → unlocked
 *   loading → locked (needsSetup: true)      → setupEncryptionOnly (shows recovery secret) → completeUnlock → unlocked
 *   loading → locked (needsSetup: false)     → after unlock                                                 → unlocked
 *   unlocked → after lock() or logout()      → locked
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import {
  hasEncryptionSetup,
  unlockWithPassphrase,
  unlockWithRecoverySecret,
  setupEncryption,
  clearDataKey,
  tryAutoUnlock,
} from '@/lib/encryption'

// ── State type ────────────────────────────────────────────────────────────────

export type EncryptionStatus =
  | { status: 'loading' }
  | { status: 'locked'; userId: string; needsSetup: boolean }
  | { status: 'unlocked'; userId: string }

// ── Context type ──────────────────────────────────────────────────────────────

interface EncryptionContextValue {
  state: EncryptionStatus
  /** Unlock using the user's encryption passphrase. Throws on wrong passphrase. */
  unlock: (passphrase: string, rememberDevice?: boolean) => Promise<void>
  /**
   * Run encryption setup (generates data key, wraps with passphrase + recovery secret,
   * uploads to Supabase, loads key in memory) without immediately transitioning to 'unlocked'.
   * This allows the setup screen to display the recovery secret to the user first.
   */
  setupEncryptionOnly: (passphrase: string, rememberDevice?: boolean) => Promise<{ recoverySecret: string }>
  /** Mark setup/unlock as complete and transition state to 'unlocked'. */
  completeUnlock: () => void
  /** Convenience: setup and immediately unlock (for non-interactive flows). */
  setupAndUnlock: (passphrase: string, rememberDevice?: boolean) => Promise<{ recoverySecret: string }>
  /** Unlock using the one-time recovery secret. */
  unlockWithRecovery: (secret: string, rememberDevice?: boolean) => Promise<void>
  /** Lock encryption (clears in-memory key and device session). Auth session remains active. */
  lock: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const EncryptionContext = createContext<EncryptionContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

interface EncryptionProviderProps {
  /** The authenticated user's ID. Pass null / undefined when not logged in. */
  userId: string | null | undefined
  children: React.ReactNode
}

export function EncryptionProvider({ userId, children }: EncryptionProviderProps) {
  const [state, setState] = useState<EncryptionStatus>({ status: 'loading' })

  // When userId changes (login / logout / page load), check encryption state.
  useEffect(() => {
    if (!userId) {
      clearDataKey()
      setState({ status: 'loading' })
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        // 1. Try to auto-unlock using the saved device session on this browser
        const autoUnlocked = await tryAutoUnlock(userId)
        if (autoUnlocked && !cancelled) {
          setState({ status: 'unlocked', userId })
          return
        }

        // 2. If no saved device session, check whether user has completed encryption setup
        const hasSetup = await hasEncryptionSetup(userId)
        if (!cancelled) {
          setState({ status: 'locked', userId, needsSetup: !hasSetup })
        }
      } catch {
        // Network error or Supabase unavailable — stay locked
        if (!cancelled) {
          setState({ status: 'locked', userId, needsSetup: false })
        }
      }
    })()

    return () => { cancelled = true }
  }, [userId])

  const unlock = useCallback(async (passphrase: string, rememberDevice = true) => {
    if (state.status === 'loading') throw new Error('Not ready.')
    await unlockWithPassphrase(passphrase, state.userId, rememberDevice)
    setState({ status: 'unlocked', userId: state.userId })
  }, [state])

  const setupEncryptionOnly = useCallback(async (passphrase: string, rememberDevice = true) => {
    if (state.status === 'loading') throw new Error('Not ready.')
    const result = await setupEncryption(passphrase, state.userId, rememberDevice)
    // DO NOT change state to 'unlocked' yet!
    // Keeps state in 'locked' so EncryptionSetupScreen stays mounted and can show the recovery secret.
    return result
  }, [state])

  const completeUnlock = useCallback(() => {
    if (state.status === 'loading') return
    setState({ status: 'unlocked', userId: state.userId })
  }, [state])

  const setupAndUnlock = useCallback(async (passphrase: string, rememberDevice = true) => {
    if (state.status === 'loading') throw new Error('Not ready.')
    const result = await setupEncryption(passphrase, state.userId, rememberDevice)
    setState({ status: 'unlocked', userId: state.userId })
    return result
  }, [state])

  const unlockWithRecovery = useCallback(async (secret: string, rememberDevice = true) => {
    if (state.status === 'loading') throw new Error('Not ready.')
    await unlockWithRecoverySecret(secret, state.userId, rememberDevice)
    setState({ status: 'unlocked', userId: state.userId })
  }, [state])


  const lock = useCallback(() => {
    const currentUserId = state.status !== 'loading' ? state.userId : undefined
    clearDataKey(currentUserId)
    if (state.status === 'unlocked') {
      setState({ status: 'locked', userId: state.userId, needsSetup: false })
    }
  }, [state])

  return (
    <EncryptionContext.Provider
      value={{
        state,
        unlock,
        setupEncryptionOnly,
        completeUnlock,
        setupAndUnlock,
        unlockWithRecovery,
        lock,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEncryption(): EncryptionContextValue {
  const ctx = useContext(EncryptionContext)
  if (!ctx) {
    throw new Error('useEncryption must be used within an EncryptionProvider.')
  }
  return ctx
}

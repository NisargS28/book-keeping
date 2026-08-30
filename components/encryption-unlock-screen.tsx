"use client"

/**
 * components/encryption-unlock-screen.tsx
 *
 * Shown after successful Supabase authentication when encryption is locked
 * (i.e. the user has encryption set up but the in-memory data key is absent,
 * which happens on every page load/refresh after the beforeunload handler runs).
 *
 * Offers two unlock paths:
 *   1. Primary: encryption passphrase
 *   2. Fallback: recovery secret (in case passphrase is forgotten)
 */

import React, { useState } from "react"
import { useEncryption } from "./encryption-provider"
import { IncorrectPassphraseError, InvalidRecoverySecretError } from "@/lib/encryption"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, RefreshCw, Key } from "lucide-react"

type Mode = "passphrase" | "recovery"

export function EncryptionUnlockScreen() {
  const { unlock, unlockWithRecovery } = useEncryption()

  const [mode, setMode] = useState<Mode>("passphrase")
  const [value, setValue] = useState("")
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === "passphrase") {
        await unlock(value, rememberDevice)
      } else {
        await unlockWithRecovery(value.replace(/[-\s]/g, "").toLowerCase(), rememberDevice)
      }
    } catch (err: unknown) {
      if (err instanceof IncorrectPassphraseError) {
        setError("Incorrect passphrase. Please try again.")
      } else if (err instanceof InvalidRecoverySecretError) {
        setError("Invalid recovery secret. Check for typos and try again.")
      } else {
        setError(err instanceof Error ? err.message : "Unlock failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  function switchMode(newMode: Mode) {
    setMode(newMode)
    setValue("")
    setError(null)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <Card className="relative z-10 w-full max-w-md border border-border/80 bg-card/95 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <CardHeader className="space-y-3 px-6 pt-8 text-center sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
            {mode === "passphrase" ? <Lock className="h-7 w-7" /> : <KeyRound className="h-7 w-7 text-amber-500" />}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {mode === "passphrase" ? "Unlock Your Vault" : "Restore Access"}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {mode === "passphrase"
              ? "Enter your encryption passphrase to decrypt your books, categories, and entries in browser memory."
              : "Enter your 64-character recovery secret to unwrap your data encryption key."}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8 sm:px-8">
          <form onSubmit={handleUnlock} className="space-y-4">
            {mode === "passphrase" ? (
              <div className="space-y-2">
                <Label htmlFor="enc-unlock-passphrase">Encryption Passphrase</Label>
                <div className="relative">
                  <Input
                    id="enc-unlock-passphrase"
                    type={showPassphrase ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your passphrase"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    required
                    autoFocus
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                  >
                    {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="enc-recovery-input">Recovery Secret</Label>
                <Input
                  id="enc-recovery-input"
                  type="text"
                  autoComplete="off"
                  placeholder="xxxxxxxx-xxxxxxxx-… (64 hex characters)"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  autoFocus
                  className="font-mono text-xs sm:text-sm tracking-wide"
                />
                <p className="text-[11px] text-muted-foreground">
                  Hyphens and spaces are automatically removed.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="remember-device"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
              />
              <Label
                htmlFor="remember-device"
                className="text-xs text-foreground/80 font-medium cursor-pointer select-none"
              >
                Remember this device (stay unlocked on this browser)
              </Label>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 font-semibold shadow-lg shadow-primary/20"
              disabled={loading || !value.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Unwrapping Key...</span>
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  <span>{mode === "passphrase" ? "Unlock Ledger" : "Recover & Unlock"}</span>
                </>
              )}
            </Button>
          </form>

          <div className="mt-5 text-center">
            {mode === "passphrase" ? (
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={() => switchMode("recovery")}
              >
                Forgot passphrase? Use recovery secret →
              </button>
            ) : (
              <button
                type="button"
                className="text-xs font-semibold text-primary hover:underline"
                onClick={() => switchMode("passphrase")}
              >
                ← Back to passphrase unlock
              </button>
            )}
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 p-2.5 text-[11px] text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
            <span>
              Your vault will remain unlocked on this device until you explicitly click &ldquo;Lock Vault&rdquo; or &ldquo;Sign Out&rdquo;.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


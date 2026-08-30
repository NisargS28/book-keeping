"use client"

/**
 * components/encryption-setup-screen.tsx
 *
 * First-time encryption setup screen.
 * Shown when a newly registered user has no encryption key material in Supabase.
 *
 * Flow:
 *   1. User enters + confirms a passphrase.
 *   2. setupEncryptionOnly() generates the data key, wraps it, stores in Supabase.
 *   3. A 64-char hex recovery secret is returned and displayed.
 *   4. User must copy/download and confirm before clicking "Continue to CashBook".
 *   5. completeUnlock() transitions the app to the unlocked state.
 *
 * The recovery secret is shown exactly once and is never stored server-side.
 */

import React, { useState } from "react"
import { useEncryption } from "./encryption-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lock,
  ArrowRight,
} from "lucide-react"

export function EncryptionSetupScreen() {
  const { setupEncryptionOnly, completeUnlock } = useEncryption()

  const [passphrase, setPassphrase] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [rememberDevice, setRememberDevice] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recoverySecret, setRecoverySecret] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (passphrase.length < 12) {
      setError("Passphrase must be at least 12 characters.")
      return
    }
    if (passphrase !== confirm) {
      setError("Passphrases do not match.")
      return
    }

    setLoading(true)
    try {
      const { recoverySecret: secret } = await setupEncryptionOnly(passphrase, rememberDevice)
      setRecoverySecret(secret)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Setup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!recoverySecret) return
    await navigator.clipboard.writeText(recoverySecret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    if (!recoverySecret) return
    const blob = new Blob(
      [
        `CashBook Zero-Knowledge Encryption Recovery Secret\n` +
          `==================================================\n\n` +
          `Save this in a secure location (e.g. password manager, safe offline storage).\n` +
          `Do NOT share this secret with anyone. Our servers do not have this key.\n\n` +
          `Recovery Secret:\n${recoverySecret}\n`,
      ],
      { type: "text/plain" }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cashbook-recovery-secret.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Step 2: Show recovery secret
  if (recoverySecret) {
    const formatted = (recoverySecret.match(/.{1,8}/g) ?? []).join("-")

    return (
      <div className="relative flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
        <Card className="relative z-10 w-full max-w-lg border border-border/80 bg-card/95 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
          <CardHeader className="space-y-3 px-6 pt-8 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-inner">
              <KeyRound className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Save Your Recovery Secret</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              This is the <strong className="text-foreground">only time</strong> you will see this secret. If you forget your passphrase and lose this secret, your financial records <strong className="text-destructive">cannot be recovered</strong> by anyone.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8 sm:px-8">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>One-Time Emergency Secret</span>
              </div>
              <div className="mt-3 overflow-x-auto rounded-lg bg-background/90 p-3.5 border border-border/80 shadow-inner">
                <code className="font-mono text-xs sm:text-sm font-semibold tracking-wide text-foreground break-all select-all">
                  {formatted}
                </code>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-border/80 hover:bg-muted font-medium"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Secret"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 border-border/80 hover:bg-muted font-medium"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Download .txt
              </Button>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/40 p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                <span className="text-xs sm:text-sm text-foreground/90 font-medium leading-snug">
                  I have saved my recovery secret in a secure location and understand it cannot be displayed again.
                </span>
              </label>
            </div>

            <Button
              type="button"
              className="w-full gap-2 font-semibold shadow-lg shadow-primary/20"
              disabled={!acknowledged}
              onClick={() => {
                completeUnlock()
              }}
            >
              <span>Continue to CashBook</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Step 1: Enter passphrase
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
      <Card className="relative z-10 w-full max-w-md border border-border/80 bg-card/95 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
        <CardHeader className="space-y-3 px-6 pt-8 text-center sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
            <Lock className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Set Up Zero-Knowledge Encryption</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Create an encryption passphrase to seal your financial records. Your data is encrypted in your browser with AES-256-GCM before reaching the server.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8 sm:px-8">
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="enc-passphrase">Encryption Passphrase</Label>
              <div className="relative">
                <Input
                  id="enc-passphrase"
                  type={showPassphrase ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimum 12 characters"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  required
                  minLength={12}
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

            <div className="space-y-2">
              <Label htmlFor="enc-confirm">Confirm Passphrase</Label>
              <div className="relative">
                <Input
                  id="enc-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter passphrase"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="remember-device-setup"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
              />
              <Label
                htmlFor="remember-device-setup"
                className="text-xs text-foreground/80 font-medium cursor-pointer select-none"
              >
                Remember this device (stay unlocked on this browser)
              </Label>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive font-medium border border-destructive/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 font-semibold shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? "Encrypting & Storing Key..." : "Set Up Encryption"}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              This passphrase is separate from your login password. You will receive a recovery secret on the next step.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

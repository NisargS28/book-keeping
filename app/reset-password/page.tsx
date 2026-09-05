"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { updatePassword } from "@/lib/auth"
import { PASSWORD_RECOVERY_STORAGE_KEY } from "@/components/password-recovery-redirect"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function getRecoveryLinkError() {
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const errorDescription = searchParams.get("error_description") || hashParams.get("error_description")

  return errorDescription?.replace(/\+/g, " ") || ""
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [recoverySession, setRecoverySession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [linkError, setLinkError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const recoveryLinkError = getRecoveryLinkError()
    if (recoveryLinkError) {
      sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY)
      setLinkError(recoveryLinkError)
      setChecking(false)
      return
    }

    const markRecoverySessionReady = () => {
      sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "true")
      setRecoverySession(true)
      setChecking(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        markRecoverySessionReady()
      }
    })

    void supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      // Supabase may finish consuming the recovery URL before this page mounts.
      if (sessionError) {
        setLinkError(sessionError.message)
      } else if (session) {
        markRecoverySessionReady()
        return
      }
      setChecking(false)
    })

    const timeout = window.setTimeout(() => setChecking(false), 2500)
    return () => {
      window.clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const { error: updateError } = await updatePassword(password)
    if (updateError) {
      setError("Unable to update your password. Please request a new reset link and try again.")
      setLoading(false)
      return
    }

    sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY)
    await supabase.auth.signOut()
    router.replace("/login?passwordReset=success")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5 sm:p-8">
      <Card className="w-full max-w-md border border-border/80 bg-card/95 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
        <CardHeader className="space-y-3 px-7 pt-8 text-center sm:px-9">
          <div className="flex justify-center">
            <img src="/Ledgerly.png" alt="Ledgerly" className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-primary/20" />
          </div>
          <CardTitle className="text-2xl tracking-tight">Create new password</CardTitle>
          <CardDescription>Set a new password for signing in to Ledgerly.</CardDescription>
        </CardHeader>
        <CardContent className="px-7 pb-8 sm:px-9">
          {checking ? (
            <div className="flex flex-col items-center gap-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Checking your reset link...
            </div>
          ) : !recoverySession ? (
            <div className="space-y-5 text-center">
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                {linkError || "This password-reset link is invalid or has expired. Request a new link to continue."}
              </div>
              <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>
              {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</div>}
              <p className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                This updates only your Ledgerly sign-in password. Your encryption passphrase remains unchanged.
              </p>
              <Button type="submit" className="h-11 w-full gap-2" disabled={loading}>
                {loading ? "Updating password..." : "Update password"}
                {!loading && <KeyRound className="h-4 w-4" />}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

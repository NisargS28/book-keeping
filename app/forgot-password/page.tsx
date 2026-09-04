"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Send } from "lucide-react"
import { requestPasswordReset } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    const { error: resetError } = await requestPasswordReset(
      email.trim(),
      `${window.location.origin}/reset-password`,
    )

    setLoading(false)
    if (resetError) {
      setError("We couldn't send a reset email right now. Please try again.")
      return
    }

    setSent(true)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-5 sm:p-8">
      <Card className="w-full max-w-md border border-border/80 bg-card/95 shadow-xl shadow-slate-950/10 backdrop-blur-xl">
        <CardHeader className="space-y-3 px-7 pt-8 text-center sm:px-9">
          <div className="flex justify-center">
            <img src="/Ledgerly.png" alt="Ledgerly" className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-primary/20" />
          </div>
          <CardTitle className="text-2xl tracking-tight">Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send a link to reset your Ledgerly sign-in password.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-7 pb-8 sm:px-9">
          {sent ? (
            <div className="space-y-5 text-center">
              <div className="rounded-xl border border-success/20 bg-success/10 p-4 text-sm text-success">
                If an account exists for that email, a password-reset link has been sent. Check your inbox and spam folder.
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                This only resets your sign-in password. Your encryption passphrase is separate; use your recovery secret if you forget it.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</div>}
              <p className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
                This changes only your Ledgerly sign-in password. It cannot reset or recover your encryption passphrase.
              </p>
              <Button type="submit" className="h-11 w-full gap-2" disabled={loading}>
                {loading ? "Sending reset link..." : "Send reset link"}
                {!loading && <Send className="h-4 w-4" />}
              </Button>
              <div className="text-center">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

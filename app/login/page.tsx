"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { login } from "@/lib/auth"
import { ArrowUpRight, Eye, EyeOff, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordReset, setPasswordReset] = useState(false)

  useEffect(() => {
    setPasswordReset(new URLSearchParams(window.location.search).get("passwordReset") === "success")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { error: loginError } = await login(email, password)
      if (loginError) {
        throw loginError
      }
      router.push("/books")
    } catch (err: any) {
      setError(err?.message || "Failed to sign in")
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10 flex items-center gap-3 text-xl font-bold">
          <img src="/Ledgerly.png" alt="Ledgerly" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
          Ledgerly
        </div>
        <div className="relative z-10 max-w-md">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-sidebar-primary">A clearer view of your money</p>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">Bookkeeping that keeps up with you.</h1>
          <p className="mt-6 text-lg leading-8 text-sidebar-foreground/70">Track income, expenses, and every important decision from one calm, organized workspace.</p>
          <div className="mt-10 flex items-center gap-3 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/15"><ShieldCheck className="h-4 w-4 text-sidebar-primary" /></span> Private, secure, and always in your control</div>
        </div>
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sidebar-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      </section>
      <section className="flex items-center justify-center p-5 sm:p-8">
      <Card className="w-full max-w-md border-0 bg-card/90 shadow-xl shadow-slate-950/10">
        <CardHeader className="space-y-3 px-7 pt-8 text-center sm:px-9">
          <div className="flex justify-center lg:hidden">
            <img src="/Ledgerly.png" alt="Ledgerly" className="h-12 w-12 rounded-2xl object-cover shadow-lg shadow-primary/20" />
          </div>
          <CardTitle className="text-2xl tracking-tight">Welcome back</CardTitle>
          <CardDescription>Sign in to manage your finances</CardDescription>
        </CardHeader>
        <CardContent className="px-7 pb-8 sm:px-9">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            {passwordReset && (
              <div className="rounded-xl border border-success/20 bg-success/10 px-3 py-2.5 text-sm text-success">
                Your password has been updated. Please sign in.
              </div>
            )}
            {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</div>}
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowUpRight className="h-4 w-4" />}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
      </section>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { signup } from "@/lib/auth"
import { ArrowUpRight, BookA as Book2, Eye, EyeOff, ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    try {
      await signup(email, password, name)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err?.message || "Failed to sign up")
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10 flex items-center gap-3 text-xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Book2 className="h-5 w-5" /></span>
          CashBook
        </div>
        <div className="relative z-10 max-w-md">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-sidebar-primary">Start with clarity</p>
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">Make every rupee easier to follow.</h1>
          <p className="mt-6 text-lg leading-8 text-sidebar-foreground/70">Set up dedicated books for life and work, then turn your daily activity into useful financial context.</p>
          <div className="mt-10 flex items-center gap-3 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary/15"><ShieldCheck className="h-4 w-4 text-sidebar-primary" /></span> Your bookkeeping starts private by default</div>
        </div>
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-sidebar-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      </section>
      <section className="flex items-center justify-center p-5 sm:p-8">
      <Card className="w-full max-w-md border-0 bg-card/90 shadow-xl shadow-slate-950/10">
        <CardHeader className="space-y-3 px-7 pt-8 text-center sm:px-9">
          <div className="flex justify-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Book2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl tracking-tight">Create your account</CardTitle>
          <CardDescription>Get started with CashBook today</CardDescription>
        </CardHeader>
        <CardContent className="px-7 pb-8 sm:px-9">
          <div className="mb-5 rounded-xl border border-primary/15 bg-primary/5 p-3.5 text-sm text-primary">
            <p className="mb-1 font-semibold">Email verification required</p>
            <p className="text-xs">
              After signing up, you&apos;ll receive a verification link via email. Please click the link to verify your
              account, then return to the login page to sign in. The verification link expires after one use.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
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
            {error && <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</div>}
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
              {!loading && <ArrowUpRight className="h-4 w-4" />}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
      </section>
    </div>
  )
}

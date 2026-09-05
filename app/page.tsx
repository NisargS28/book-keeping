"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Layers,
  LayoutDashboard,
  Lock,
  Mail,
  MailCheck,
  Menu,
  Minus,
  Moon,
  MoveRight,
  PieChart,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCurrentUser } from "@/lib/auth"

type ScreenshotTab = "dashboard" | "ledger" | "books" | "reports"

interface TabConfig {
  id: ScreenshotTab
  title: string
  subtitle: string
  image: string
  badge: string
  description: string
  demoUrl: string
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const TABS: TabConfig[] = [
  {
    id: "dashboard",
    title: "Analytics Dashboard",
    subtitle: "Real-time cash flow & margins",
    image: "/screenshots/dashboard.png",
    badge: "Financial Intelligence",
    description: "Visualize income trajectories, expense velocity, savings rates, and category distribution with interactive charts.",
    demoUrl: "/demo?tab=dashboard",
  },
  {
    id: "ledger",
    title: "Multi-Book Ledger",
    subtitle: "Clean running balances & search",
    image: "/screenshots/ledger.png",
    badge: "Master Register",
    description: "Lightning-fast transaction ledger with real-time search, payment mode tagging (UPI, Card, Bank, Cash), and audit details.",
    demoUrl: "/demo?tab=ledger",
  },
  {
    id: "books",
    title: "Books Management",
    subtitle: "Separate personal & business books",
    image: "/screenshots/books.png",
    badge: "Isolated Vaults",
    description: "Manage unlimited independent cashbooks for consulting, rental real estate, startups, and household budgets in one interface.",
    demoUrl: "/demo?tab=books",
  },
  {
    id: "reports",
    title: "Financial Statements",
    subtitle: "Exportable PDF & CSV audit reports",
    image: "/screenshots/reports.png",
    badge: "Audit-Ready",
    description: "Generate day-wise and category-wise financial summaries with verified cryptographic integrity for taxes and partners.",
    demoUrl: "/demo?tab=reports",
  },
]

export default function LandingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ScreenshotTab>("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isAppInstalled, setIsAppInstalled] = useState(false)
  const [installInstructionsOpen, setInstallInstructionsOpen] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isRedirectingFromPwa, setIsRedirectingFromPwa] = useState(false)

  useEffect(() => {
    const displayModeQuery = window.matchMedia("(display-mode: standalone)")
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }
    const isStandalonePwa = displayModeQuery.matches || navigatorWithStandalone.standalone === true
    const isMobileDevice =
      /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent) ||
      (window.navigator.maxTouchPoints > 1 && window.matchMedia("(pointer: coarse)").matches)

    if (isStandalonePwa && isMobileDevice) {
      setIsRedirectingFromPwa(true)
      router.replace("/books")
    }
  }, [router])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setIsLoggedIn(true)
        }
      } catch (err) {
        // silent fail for unauthenticated visitors
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldUseDarkMode = savedTheme === "dark" || (savedTheme === "system" && prefersDark)

    document.documentElement.classList.toggle("dark", shouldUseDarkMode)
    setIsDarkMode(shouldUseDarkMode)
  }, [])

  useEffect(() => {
    const displayModeQuery = window.matchMedia("(display-mode: standalone)")
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }

    const updateInstalledState = () => {
      setIsAppInstalled(displayModeQuery.matches || navigatorWithStandalone.standalone === true)
    }
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setInstallInstructionsOpen(false)
      setIsAppInstalled(true)
    }

    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent))
    updateInstalledState()
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    displayModeQuery.addEventListener("change", updateInstalledState)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      displayModeQuery.removeEventListener("change", updateInstalledState)
    }
  }, [])

  const currentTabConfig = TABS.find((t) => t.id === activeTab) || TABS[0]

  const handleCopySimulatedCode = () => {
    navigator.clipboard.writeText("e7c1f8a29b4d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f")
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleDownloadSampleSecret = () => {
    const blob = new Blob(
      [
        `Ledgerly Zero-Knowledge Encryption Recovery Secret\n` +
          `==================================================\n\n` +
          `Save this in a secure location (e.g. password manager, safe offline storage).\n` +
          `Do NOT share this secret with anyone. Our servers do not have this key.\n\n` +
          `Recovery Secret:\ne7c1f8a29b4d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f\n`,
      ],
      { type: "text/plain" }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ledgerly-recovery-secret.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleThemeToggle = () => {
    const nextIsDarkMode = !isDarkMode
    document.documentElement.classList.toggle("dark", nextIsDarkMode)
    localStorage.setItem("theme", nextIsDarkMode ? "dark" : "light")
    setIsDarkMode(nextIsDarkMode)
  }

  const handleInstallApp = async () => {
    if (!installPrompt) {
      setInstallInstructionsOpen(true)
      return
    }

    try {
      await installPrompt.prompt()
      const choice = await installPrompt.userChoice
      if (choice.outcome === "accepted") {
        setIsAppInstalled(true)
      }
    } finally {
      setInstallPrompt(null)
    }
  }

  if (isRedirectingFromPwa) {
    return null
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-foreground">
      {/* -------------------- 1. NAVIGATION BAR -------------------- */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <img
                src="/Ledgerly.png"
                alt="Ledgerly"
                className="h-9 w-9 rounded-xl object-cover shadow-sm ring-1 ring-border/50 sm:h-10 sm:w-10"
              />
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight sm:text-xl">Ledgerly</span>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider -mt-1 hidden sm:inline">
                  Zero-Knowledge Bookkeeping
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#preview" className="hover:text-foreground transition-colors">
              Product Tour
            </a>
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Workflow
            </a>
            <a href="#security" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Security
            </a>
            <a href="#reports" className="hover:text-foreground transition-colors">
              Reports
            </a>
            <a href="#docs" className="hover:text-foreground transition-colors flex items-center gap-1.5 text-primary font-semibold">
              <FileText className="h-4 w-4" />
              Setup Docs
            </a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
              aria-label={`Switch to ${isDarkMode ? "light" : "dark"} theme`}
              title={`Switch to ${isDarkMode ? "light" : "dark"} theme`}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Demo CTA Button */}
            <Link
              href="/demo"
              className="relative hidden items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 hover:border-primary transition-all shadow-xs sm:inline-flex sm:text-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Demo</span>
            </Link>

            {isLoggedIn ? (
              <Button
                onClick={() => router.push("/books")}
                className="gap-1.5 text-xs sm:text-sm font-semibold shadow-xs"
              >
                Go to App
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-3 py-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="hidden items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all hover:shadow-md sm:inline-flex sm:px-4 sm:py-2 sm:text-sm"
                >
                  <span>Start Free</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border/80 bg-card p-4 space-y-3">
            <nav className="flex flex-col space-y-3 text-sm font-medium">
              <a
                href="#preview"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Product Tour
              </a>
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#workflow"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Workflow
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Security & Privacy
              </a>
              <a
                href="#reports"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Reports
              </a>
              <a
                href="#docs"
                onClick={() => setMobileMenuOpen(false)}
                className="text-primary font-bold flex items-center gap-1.5"
              >
                <FileText className="h-4 w-4" />
                Setup & Onboarding Docs
              </a>
              <Link
                href="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className="text-primary font-bold flex items-center gap-1.5 pt-2 border-t border-border/60"
              >
                <Sparkles className="h-4 w-4" />
                Launch Live Demo
              </Link>
              <button
                type="button"
                onClick={handleThemeToggle}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>Switch to {isDarkMode ? "light" : "dark"} theme</span>
              </button>
              <div className="flex gap-2 pt-2">
                <Link
                  href="/login"
                  className="flex-1 text-center py-2 rounded-lg border border-border text-xs font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex-1 text-center py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                >
                  Start Free
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* -------------------- 2. HERO SECTION -------------------- */}
      <section className="relative overflow-hidden pb-14 pt-8 sm:pb-20 sm:pt-12 md:pb-28 md:pt-20">
        {/* Subtle Ambient Radial Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/15 blur-[120px] -z-10" />
        <div className="pointer-events-none absolute top-40 right-10 w-96 h-96 rounded-full bg-cyan-500/10 blur-[100px] -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-2xs transition-colors hover:bg-primary/15 sm:mb-6 sm:px-3.5 sm:text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="sm:hidden">Private AES-256 encryption</span>
            <span className="hidden sm:inline">Zero-Knowledge Client-Side AES-256 Encryption</span>
            <span className="hidden sm:inline text-primary/60">•</span>
            <span className="hidden sm:inline text-muted-foreground font-normal">Multi-Book Architecture</span>
          </div>

          {/* Main Headline */}
          <h1 className="mx-auto max-w-5xl text-[2.1rem] font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Financial clarity without compromising your{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-600 to-teal-500 bg-clip-text text-transparent">
              privacy.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-4 max-w-3xl text-[15px] leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg md:text-xl">
            Manage multiple business & personal books, track real-time cash flow, collaborate effortlessly,
            and log transactions on the go with zero delay. Your financial data is encrypted in your browser before it ever reaches the cloud.
          </p>

          {/* Hero CTAs */}
          <div className="mx-auto mt-7 flex max-w-2xl flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm sm:text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <span>Start Free Account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-card/80 backdrop-blur-sm px-6 py-3.5 text-sm sm:text-base font-bold text-foreground hover:bg-secondary hover:border-primary transition-all shadow-sm group"
            >
              <Sparkles className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
              <span>Explore Live Demo</span>
            </Link>

            {!isAppInstalled && (
              <Button
                type="button"
                variant="outline"
                onClick={handleInstallApp}
                className="h-auto w-full rounded-xl border-2 px-6 py-3.5 text-sm font-bold shadow-sm sm:w-auto sm:text-base"
              >
                <Download className="h-4 w-4" />
                Install App
              </Button>
            )}
          </div>

          {/* Micro Reassurances */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Zero third-party tracking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>Instant setup in 30 seconds</span>
            </div>
          </div>
        </div>

        {/* -------------------- 3. REAL PRODUCT SCREENSHOT SHOWCASE -------------------- */}
        <div id="preview" className="mx-auto mt-10 max-w-6xl px-3 sm:mt-16 sm:px-6 lg:px-8">
          {/* Interactive Screenshot Selector Tabs */}
          <div className="mb-4 flex items-center justify-start sm:mb-6 sm:justify-center">
            <div className="flex w-full max-w-full overflow-x-auto rounded-xl border border-border/80 bg-card/90 p-1.5 shadow-md backdrop-blur-md scrollbar-none sm:w-auto">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    }`}
                  >
                    {tab.id === "dashboard" && <LayoutDashboard className="h-4 w-4" />}
                    {tab.id === "ledger" && <BookOpen className="h-4 w-4" />}
                    {tab.id === "books" && <Wallet className="h-4 w-4" />}
                    {tab.id === "reports" && <FileText className="h-4 w-4" />}
                    <span>{tab.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Browser Window Frame with Real Application Screenshot */}
          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card shadow-xl ring-1 ring-black/5 transition-all duration-300 dark:ring-white/10 sm:rounded-2xl sm:shadow-2xl">
            {/* Top Browser Bar */}
            <div className="flex items-center justify-between border-b border-border/70 bg-muted/60 px-3 py-2.5 text-xs sm:px-4 sm:py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/90" />
                <span className="h-3 w-3 rounded-full bg-amber-400/90" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/90" />
                <span className="ml-2 font-mono text-[11px] text-muted-foreground hidden sm:inline">
                  ledgerly.app/{activeTab}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  <span className="hidden sm:inline">Real App Screenshot</span>
                </span>
                <Link
                  href={currentTabConfig.demoUrl}
                  className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline sm:ml-2 sm:text-xs"
                >
                  Test in Demo
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* The Real Screenshot Image */}
            <div className="group relative aspect-[4/3] w-full overflow-hidden bg-muted/20 sm:aspect-[16/10]">
              <img
                src={currentTabConfig.image}
                alt={`${currentTabConfig.title} real product interface`}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
              />

              {/* Floating Overlay Hint on Hover */}
              <div className="absolute inset-0 hidden items-end bg-gradient-to-t from-background/90 via-transparent to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
                <div className="flex items-center justify-between w-full bg-card/90 backdrop-blur-md rounded-xl p-4 border border-border/80 shadow-lg">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {currentTabConfig.badge}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-foreground">
                      {currentTabConfig.title} — {currentTabConfig.subtitle}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                      {currentTabConfig.description}
                    </p>
                  </div>
                  <Link
                    href={currentTabConfig.demoUrl}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 shrink-0 ml-4"
                  >
                    Open View in Demo
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Caption Under Frame */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground px-2">
            <p>
              📸 Unedited screenshot captured from the live Ledgerly application with simulated business accounts.
            </p>
            <Link href="/demo" className="font-semibold text-primary hover:underline flex items-center gap-1">
              Interact with this data in the Live Demo →
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------- 4. VALUE PROPOSITION & TRUST METRICS -------------------- */}
      <section className="border-y border-border/70 bg-muted/30 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Zero-Knowledge Architecture</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Records are encrypted in your browser using AES-256-GCM. We never see your balances, transactions, or partners.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Multi-Book Partitioning</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Keep agency retainers, consulting fees, side hustles, and household finances strictly partitioned.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Payment Modes & Counterparties</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tag transactions with UPI, Card, Bank Wire, or Cash. Attach customer names, invoices, and reference notes.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Instant Audit Statements</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Download verified Day-wise and Category-wise PDF/CSV statements with cryptographic seals for tax time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 5. COMPREHENSIVE FEATURES GRID -------------------- */}
      <section id="features" className="py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Engineered for Clarity</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Everything you need to master your money.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              A comprehensive toolkit for freelancers, founders, landlords, and busy households who demand speed and privacy.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1: Multi-Book */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:shadow-md transition-all hover:border-primary/50 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:scale-110 transition-transform">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Multi-Book Segregation</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Never mix business expenses with family groceries. Create separate ledgers with custom currencies, opening balances, and distinct categories.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-primary font-semibold">
                <span className="rounded-md bg-secondary px-2 py-0.5">Agency</span>
                <span className="rounded-md bg-secondary px-2 py-0.5">Rental Property</span>
                <span className="rounded-md bg-secondary px-2 py-0.5">Household</span>
              </div>
            </div>

            {/* Feature 2: Quick-Add & Contra Reversals */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:shadow-md transition-all hover:border-emerald-500/50 group relative overflow-hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-5 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Quick Inflow/Outflow & Contra Entries</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Lightning fast transaction modals. Duplicate entries, move records between books, or generate automated opposite (contra reversal) entries in a single click.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-emerald-600 font-semibold">
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5">+ Cash In</span>
                <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-600">- Cash Out</span>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-foreground">Contra Reversals</span>
              </div>
            </div>

            {/* Feature 3: Real-Time Cash Flow Analytics */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:shadow-md transition-all hover:border-cyan-500/50 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 mb-5 group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Dynamic Analytics Dashboard</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Stay on top of liquidity. Filter by This Month, Last 3 Months, or This Year. Toggle between Area and Bar charts, and inspect your savings margin.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-cyan-600">
                <BarChart3 className="h-4 w-4" />
                <span>Interactive Recharts Engine</span>
              </div>
            </div>

            {/* Feature 4: Granular Categorization & Payment Modes */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:shadow-md transition-all hover:border-amber-500/50 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-5 group-hover:scale-110 transition-transform">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Tags, Parties & Payment Modes</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Assign entries to UPI, Credit Card, Net Banking, or Cash. Attach counterparty names and notes for airtight bookkeeping.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-muted-foreground font-mono">
                <span className="rounded border border-border px-1.5 py-0.5">UPI</span>
                <span className="rounded border border-border px-1.5 py-0.5">Card</span>
                <span className="rounded border border-border px-1.5 py-0.5">Bank Wire</span>
                <span className="rounded border border-border px-1.5 py-0.5">Cash</span>
              </div>
            </div>

            {/* Feature 5: Sub-Second Search & Filters */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:shadow-md transition-all hover:border-indigo-500/50 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 mb-5 group-hover:scale-110 transition-transform">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Sub-Second Search & Filter</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Search thousands of records in milliseconds. Filter seamlessly by income vs expense, category badges, date ranges, or vendor names.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-indigo-600">
                <Zap className="h-4 w-4" />
                <span>Instant In-Memory Decryption</span>
              </div>
            </div>

            {/* Feature 6: Progressive Web App */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:shadow-md transition-all hover:border-violet-500/50 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 mb-5 group-hover:scale-110 transition-transform">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Installable PWA</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Install Ledgerly directly onto your iPhone, Android, or desktop. Enjoy a smooth app-like experience.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-violet-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Offline Cache & Instant Launch</span>
              </div>
              {!isAppInstalled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleInstallApp}
                  className="mt-5 gap-2 border-violet-500/40 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300"
                >
                  <Download className="h-4 w-4" />
                  Install App
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 6. BOOKKEEPING WORKFLOW -------------------- */}
      <section id="workflow" className="border-y border-border/70 bg-muted/40 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Intuitive Architecture</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
              From receipt to audit statement in four calm steps.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">
              No accounting degree required. Ledgerly streamlines double-entry mechanics into a clean, human workflow.
            </p>
          </div>

          <div className="relative grid gap-5 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="rounded-2xl bg-card border border-border/80 p-6 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                    01
                  </span>
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Create Isolated Books</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Establish independent books for each business, client retainer, or household with custom starting balances.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-primary">
                Independent encryption keys
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-card border border-border/80 p-6 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                    02
                  </span>
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Log Inflow & Outflow</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Record entries via the web app or mobile PWA with dedicated categories, payment modes, and party names.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-primary">
                Tagged by payment mode & party
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-card border border-border/80 p-6 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                    03
                  </span>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Inspect Cash Trends</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Running balances recalculate instantly. Charts show cash flow health, burn rate, and capital distribution.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-primary">
                Daily, weekly, and monthly views
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl bg-card border border-border/80 p-6 shadow-xs relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
                    04
                  </span>
                  <Printer className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Export Audit Reports</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Generate clean, professional PDF statements and CSV ledgers for your accountant, tax returns, or investors.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/60 text-xs font-semibold text-primary">
                One-click PDF & CSV exports
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 7. ZERO-KNOWLEDGE SECURITY SPOTLIGHT -------------------- */}
      <section id="security" className="relative overflow-hidden py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-border/90 bg-gradient-to-br from-card via-card to-secondary/30 p-5 shadow-xl sm:rounded-3xl sm:p-12 lg:p-16">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -z-10" />

            <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-6">
                  <ShieldCheck className="h-4 w-4" />
                  <span>The Ledgerly Security Contract</span>
                </div>

                <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Your money is your business. Period.
                </h2>

                <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                  Most modern accounting apps store your income, clients, and receipts in plaintext where employees, advertisers, or hackers can access them. Ledgerly is built differently.
                </p>

                {/* Cryptographic Guarantees */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 mt-0.5">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Client-Side AES-256-GCM Encryption</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Amounts, categories, descriptions, notes, and party names are encrypted before leaving your device.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 mt-0.5">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">PBKDF2 Key Derivation (310,000 Iterations)</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your passphrase derives an AES wrapping key locally. Your raw password is never transmitted or stored.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 mt-0.5">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Ephemeral Memory-Only Data Keys</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Encryption keys exist exclusively in browser RAM. When you log out or lock your vault, the key is wiped immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Table Box */}
              <div className="rounded-2xl border border-border/80 bg-background/90 p-4 shadow-md backdrop-blur-md sm:p-6">
                <h3 className="mb-4 flex flex-col items-start gap-2 text-base font-bold sm:flex-row sm:items-center sm:justify-between">
                  <span>Privacy Architecture Comparison</span>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    Zero-Knowledge
                  </Badge>
                </h3>

                <div className="divide-y divide-border/60 text-[10px] sm:text-xs">
                  <div className="py-3 grid grid-cols-3 font-semibold text-muted-foreground">
                    <span>Feature</span>
                    <span className="text-center text-rose-500">Typical Apps</span>
                    <span className="text-right text-emerald-600 dark:text-emerald-400">Ledgerly</span>
                  </div>

                  <div className="py-3 grid grid-cols-3 items-center">
                    <span className="font-medium text-foreground">Database Storage</span>
                    <span className="text-center text-rose-500 font-semibold">Plaintext</span>
                    <span className="text-right text-emerald-600 font-bold">AES-256 Ciphertext</span>
                  </div>

                  <div className="py-3 grid grid-cols-3 items-center">
                    <span className="font-medium text-foreground">Server Admin Access</span>
                    <span className="text-center text-rose-500 font-semibold">Can view all</span>
                    <span className="text-right text-emerald-600 font-bold">Zero Knowledge</span>
                  </div>

                  <div className="py-3 grid grid-cols-3 items-center">
                    <span className="font-medium text-foreground">Key Derivation</span>
                    <span className="text-center text-muted-foreground">Server side</span>
                    <span className="text-right text-emerald-600 font-bold">Client PBKDF2</span>
                  </div>

                  <div className="py-3 grid grid-cols-3 items-center">
                    <span className="font-medium text-foreground">Emergency Recovery</span>
                    <span className="text-center text-muted-foreground">Support reset</span>
                    <span className="text-right text-emerald-600 font-bold">Secret Phrase</span>
                  </div>

                  <div className="py-3 grid grid-cols-3 items-center">
                    <span className="font-medium text-foreground">Cloud Storage</span>
                    <span className="text-center text-rose-500 font-semibold">Plaintext on Server</span>
                    <span className="text-right text-emerald-600 font-bold">Opaque Ciphertext Blobs</span>
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  🔒 Even with direct SQL access to our databases, nobody can read your financial figures without your private client key.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 8. DOCS & ONBOARDING GUIDE SECTION (NEW) -------------------- */}
      <section id="docs" className="border-y border-border/80 bg-gradient-to-b from-muted/30 via-background to-muted/20 py-14 sm:py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-3">
              <FileText className="h-3.5 w-3.5" />
              <span>Getting Started & Security Setup Docs</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Account Registration & Zero-Knowledge Setup
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Because Ledgerly is 100% zero-knowledge, onboarding has <strong>3 critical steps</strong> to secure your private financial vault. Please read this setup guide carefully.
            </p>
          </div>

          {/* 3 Step Onboarding Flow */}
          <div className="grid gap-5 sm:gap-8 lg:grid-cols-3">
            {/* Step 1: Supabase Email Confirmation */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-cyan-500" />
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 font-bold text-sm">
                    Step 1
                  </span>
                  <MailCheck className="h-5 w-5 text-cyan-600" />
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  Sign Up & Email Confirmation
                </h3>

                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Enter your email, full name, and chosen password on the registration page.
                </p>

                {/* Important Alert Box */}
                <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5">Confirmation Link Required</strong>
                      You will immediately receive an automated confirmation email from <strong>Supabase</strong>. You <strong>must click the link in that email</strong> to confirm your address before your login credentials will work.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                <span>Verification Provider</span>
                <span className="font-semibold text-foreground">Supabase Auth</span>
              </div>
            </div>

            {/* Step 2: 12-Character Encryption Passphrase */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-primary" />
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                    Step 2
                  </span>
                  <KeyRound className="h-5 w-5 text-primary" />
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  Set Encryption Passphrase
                </h3>

                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  After confirming your email, log in with your credentials. Ledgerly will prompt you to initialize your private vault.
                </p>

                {/* Requirement Alert Box */}
                <div className="mt-5 rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-foreground">
                  <div className="flex items-start gap-2">
                    <Lock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <div>
                      <strong className="font-semibold text-primary block mb-0.5">
                        Minimum 12 Characters • Memorize It
                      </strong>
                      You will be asked to enter an <strong>Encryption Passphrase of at least 12 characters</strong>. This passphrase derives your client-side AES-256 key via PBKDF2. It is never sent to our servers, so <strong>you must remember it</strong>.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                <span>Key Derivation</span>
                <span className="font-semibold text-foreground">PBKDF2 (310,000 rounds)</span>
              </div>
            </div>

            {/* Step 3: Recovery Code & .txt Download */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-7 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1.5 w-full bg-emerald-500" />
              <div>
                <div className="flex items-center justify-between mb-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-sm">
                    Step 3
                  </span>
                  <Download className="h-5 w-5 text-emerald-600" />
                </div>

                <h3 className="text-lg font-bold text-foreground">
                  Save Master Recovery Secret
                </h3>

                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Once your passphrase is set, a 64-character cryptographic <strong>Recovery Code</strong> will be generated on your device.
                </p>

                {/* Download / Screenshot Box */}
                <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-foreground">
                  <div className="flex items-start gap-2">
                    <Camera className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <div>
                      <strong className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                        .txt Download & Screenshot Option
                      </strong>
                      Save this code immediately! Ledgerly includes a <strong>".txt Download" button</strong> to save it locally, or you can <strong>take a screenshot</strong> or copy it to your password manager.
                    </div>
                  </div>
                </div>
              </div>

              {/* Crucial Recovery Notice */}
              <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-[11px] text-destructive leading-tight">
                ⚠️ <strong>Non-Negotiable:</strong> If you ever forget your passphrase, this Recovery Code is the <strong>only way</strong> to recover your data. Otherwise, data recovery is mathematically impossible.
              </div>
            </div>
          </div>

          {/* Interactive Simulated Setup Box */}
          <div className="mt-8 rounded-2xl border border-border/80 bg-card p-5 shadow-lg sm:mt-12 sm:rounded-3xl sm:p-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-bold text-foreground mb-3">
                  <span>Interactive Setup Simulation</span>
                </div>
                <h3 className="text-xl font-bold text-foreground sm:text-2xl">
                  What you will see right after your first login
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Below is a live simulation of the cryptographic setup screen. You can test downloading a sample recovery file or copying a key to see how straightforward and safe it is.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Generated in browser memory
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Never transmitted over the internet
                  </span>
                </div>
              </div>

              {/* Mock Setup Card */}
              <div className="w-full lg:max-w-md rounded-2xl border border-border bg-background p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">Your 64-Char Recovery Secret</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Generated
                  </span>
                </div>

                {/* Simulated Hash Code Box */}
                <div className="rounded-xl bg-muted/60 p-3 font-mono text-xs text-foreground/90 break-all select-all border border-border/60">
                  e7c1f8a29b4d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f
                </div>

                {/* Action Buttons: .txt Download & Copy */}
                <div className="grid grid-cols-1 gap-2.5 pt-1 min-[380px]:grid-cols-2">
                  <Button
                    onClick={handleDownloadSampleSecret}
                    variant="outline"
                    className="w-full gap-1.5 text-xs font-semibold h-9"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download .txt
                  </Button>

                  <Button
                    onClick={handleCopySimulatedCode}
                    variant="secondary"
                    className="w-full gap-1.5 text-xs font-semibold h-9"
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  💡 Tip: You can also take a screenshot of the screen and store it safely offline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 9. REPORTS SHOWCASE SECTION -------------------- */}
      <section id="reports" className="border-y border-border/70 bg-muted/30 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
            {/* Real Reports Screenshot Preview */}
            <div className="rounded-2xl border border-border/80 bg-card shadow-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 order-2 lg:order-1">
              <div className="bg-muted/50 px-4 py-2.5 border-b border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-bold">Real Reports & Statement Engine</span>
                </div>
                <span className="hidden text-[11px] font-mono text-muted-foreground sm:inline">PDF • CSV • Print</span>
              </div>
              <img
                src="/screenshots/reports.png"
                alt="Ledgerly Reports and statements interface"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Copy Content */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary mb-4">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Audit & Tax Preparedness</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Statements formatted for accountants and tax season.
              </h2>

              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                No more formatting messy Excel rows at 2 AM. Generate clean, formatted statements categorized by date, counterparty, and category in seconds.
              </p>

              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Day-Wise & Category-Wise Breakdowns</h4>
                    <p className="text-xs text-muted-foreground">
                      Group expenditures by daily volume or by cost centers like Cloud, Payroll, and Marketing.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Cryptographic Checksum Verification</h4>
                    <p className="text-xs text-muted-foreground">
                      Statements include verification hashes ensuring numbers match reconciled records.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">One-Click PDF & CSV Downloads</h4>
                    <p className="text-xs text-muted-foreground">
                      Send clean PDFs directly to your accountant or import CSV data into your tax software.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/demo?tab=reports"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition-all hover:bg-primary/90 sm:w-auto sm:text-sm"
                >
                  <span>Test Reports in Demo</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/signup"
                  className="w-full px-3 py-2 text-center text-xs font-semibold text-muted-foreground hover:text-foreground sm:w-auto sm:text-sm"
                >
                  Create Free Account →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 10. DEDICATED DEMO CTA BANNER -------------------- */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 via-card to-card p-5 shadow-lg sm:rounded-3xl sm:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-3.5 py-1 text-xs font-bold text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Full Interactive Sandbox</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Experience the entire Ledgerly app right now.
            </h2>

            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Test-drive the Analytics Dashboard, Ledger transactions, Books management, and Report generator with preloaded realistic mock data. No registration required.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm sm:text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-sm sm:text-base font-semibold hover:bg-secondary transition-all"
              >
                <span>Register Real Account</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 11. FINAL CONVERSION CTA -------------------- */}
      <section className="pb-16 pt-2 sm:pb-24 sm:pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-sidebar p-5 text-sidebar-foreground shadow-2xl sm:rounded-3xl sm:p-14 lg:p-16">
            {/* Ambient glows */}
            <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-sidebar-primary/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-2 text-sidebar-primary font-bold text-xs uppercase tracking-wider mb-4">
                <ShieldCheck className="h-4 w-4" />
                <span>Zero Risk • Private Forever</span>
              </div>

              <h2 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                Take control of your finances without giving up your privacy.
              </h2>

              <p className="mt-5 text-base sm:text-lg text-sidebar-foreground/75 leading-relaxed max-w-2xl">
                Join founders, freelancers, and organized households who trust Ledgerly for stress-free, client-side encrypted bookkeeping.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link
                  href="/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sidebar-primary px-6 py-3.5 text-sm font-bold text-sidebar-primary-foreground shadow-lg transition-all hover:opacity-90 sm:w-auto sm:px-8 sm:py-4 sm:text-base sm:hover:scale-[1.02]"
                >
                  <span>Start Free Today</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-sidebar/50 px-5 py-3.5 text-sm font-semibold text-sidebar-foreground transition-all hover:bg-sidebar-accent sm:w-auto sm:px-6 sm:py-4 sm:text-base"
                >
                  <span>Existing User? Sign In</span>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-sidebar-foreground/60">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sidebar-primary" />
                  <span>Free forever personal tier</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sidebar-primary" />
                  <span>Client-side key derivation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sidebar-primary" />
                  <span>Zero server-side keys</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- 12. FOOTER -------------------- */}
      <footer className="border-t border-border/80 bg-card/60 py-10 text-sm text-muted-foreground sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-7 border-b border-border/60 pb-10 sm:gap-8 sm:pb-12 lg:grid-cols-5">
            {/* Brand column */}
            <div className="col-span-2 space-y-4 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5">
                <img
                  src="/Ledgerly.png"
                  alt="Ledgerly"
                  className="h-9 w-9 rounded-xl object-cover shadow-xs"
                />
                <span className="text-xl font-bold tracking-tight text-foreground">Ledgerly</span>
              </Link>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                Modern, zero-knowledge bookkeeping designed for clarity and uncompromising privacy. Multi-book management, instant cash flow charts, and verified audit reports.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Protected by Client-Side AES-256-GCM</span>
              </div>
            </div>

            {/* Product links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Product</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#preview" className="hover:text-foreground transition-colors">
                    Dashboard Overview
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Multi-Book Ledger
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-foreground transition-colors">
                    Quick Entry & Contra
                  </a>
                </li>
                <li>
                  <a href="#reports" className="hover:text-foreground transition-colors">
                    Audit & Tax Reports
                  </a>
                </li>
                <li>
                  <Link href="/demo" className="text-primary font-semibold hover:underline">
                    Interactive Live Demo
                  </Link>
                </li>
              </ul>
            </div>

            {/* Docs & Setup links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Documentation</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#docs" className="hover:text-foreground transition-colors">
                    Supabase Email Verification
                  </a>
                </li>
                <li>
                  <a href="#docs" className="hover:text-foreground transition-colors">
                    12-Char Passphrase Setup
                  </a>
                </li>
                <li>
                  <a href="#docs" className="hover:text-foreground transition-colors">
                    Master Recovery Secret
                  </a>
                </li>
                <li>
                  <a href="#docs" className="hover:text-foreground transition-colors">
                    .txt Download & Screenshot Guide
                  </a>
                </li>
                <li>
                  <a href="#security" className="hover:text-foreground transition-colors">
                    Zero-Knowledge Architecture
                  </a>
                </li>
              </ul>
            </div>

            {/* Quick Access */}
            <div className="col-span-2 space-y-3 sm:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Get Started</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/signup" className="hover:text-foreground transition-colors font-medium">
                    Create Free Account
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-foreground transition-colors font-medium">
                    Sign In to Vault
                  </Link>
                </li>
                <li>
                  <Link href="/forgot-password" className="hover:text-foreground transition-colors">
                    Password Recovery
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-foreground transition-colors">
                    Demo Sandbox
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col items-center justify-between gap-4 pt-8 text-center text-xs sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} Ledgerly. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-end sm:gap-x-6">
              <span className="text-muted-foreground">Next.js 16</span>
              <span>•</span>
              <span className="text-muted-foreground">WebCrypto API</span>
              <span>•</span>
              <span className="text-muted-foreground">Supabase Auth</span>
              <span>•</span>
              <span className="text-muted-foreground">Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={installInstructionsOpen} onOpenChange={setInstallInstructionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Install Ledgerly</DialogTitle>
            <DialogDescription>
              Add Ledgerly to your home screen for quick access and an app-like experience.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border/80 bg-muted/50 p-4">
            {isIOS ? (
              <div className="flex items-start gap-3">
                <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-foreground">
                  In Safari, tap the Share button, then choose <strong>Add to Home Screen</strong>.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Download className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-foreground">
                  Open your browser menu, then choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </p>
              </div>
            )}
          </div>

          <Button type="button" onClick={() => setInstallInstructionsOpen(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

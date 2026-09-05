"use client"

import React, { useState, useMemo, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Calendar,
  ChevronDown,
  Download,
  Filter,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Lock,
  Plus,
  Minus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  Tag,
  CreditCard,
  Building,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

// --- Mock Data ---

interface MockBook {
  id: string
  name: string
  description: string
  currency: string
  balance: number
  totalIncome: number
  totalExpense: number
  entryCount: number
  lastActive: string
  color: string
}

interface MockEntry {
  id: string
  bookId: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  categoryColor: string
  paymentMode: "UPI" | "Card" | "Bank" | "Cash"
  party?: string
  notes?: string
}

const MOCK_BOOKS: MockBook[] = [
  {
    id: "book-1",
    name: "Acme Studio & Agency",
    description: "Client retainers, design sprints, software subscriptions & team payroll",
    currency: "INR",
    balance: 482500,
    totalIncome: 850000,
    totalExpense: 367500,
    entryCount: 142,
    lastActive: "10 mins ago",
    color: "#0879c9",
  },
  {
    id: "book-2",
    name: "Personal & Household",
    description: "Living expenses, groceries, utilities, savings & mutual funds",
    currency: "INR",
    balance: 165400,
    totalIncome: 320000,
    totalExpense: 154600,
    entryCount: 98,
    lastActive: "2 hours ago",
    color: "#10b981",
  },
  {
    id: "book-3",
    name: "Skyline Property Rental",
    description: "Tenant rent collections, society maintenance & apartment maintenance",
    currency: "INR",
    balance: 215000,
    totalIncome: 360000,
    totalExpense: 145000,
    entryCount: 34,
    lastActive: "1 day ago",
    color: "#8b5cf6",
  },
  {
    id: "book-4",
    name: "Cloud SaaS Project",
    description: "Stripe payouts, AWS server costs, domain renewals & API fees",
    currency: "INR",
    balance: 94800,
    totalIncome: 140000,
    totalExpense: 45200,
    entryCount: 67,
    lastActive: "3 days ago",
    color: "#f59e0b",
  },
]

const MOCK_ENTRIES: MockEntry[] = [
  {
    id: "e-1",
    bookId: "book-1",
    date: "2026-09-05",
    description: "Monthly Retainer Q3 - Apex Labs",
    amount: 220000,
    type: "income",
    category: "Client Retainer",
    categoryColor: "#10b981",
    paymentMode: "Bank",
    party: "Apex Technologies Inc.",
    notes: "Wire transfer received via NEFT ref #AX9910",
  },
  {
    id: "e-2",
    bookId: "book-1",
    date: "2026-09-04",
    description: "AWS Cloud Infrastructure Billing",
    amount: 18450,
    type: "expense",
    category: "Cloud & Servers",
    categoryColor: "#6366f1",
    paymentMode: "Card",
    party: "Amazon Web Services",
    notes: "EC2 + RDS Postgres + CloudFront bandwidth",
  },
  {
    id: "e-3",
    bookId: "book-1",
    date: "2026-09-03",
    description: "Fintech Mobile App UI/UX Milestone 2",
    amount: 145000,
    type: "income",
    category: "Design Projects",
    categoryColor: "#06b6d4",
    paymentMode: "Bank",
    party: "Stride Payments Ltd.",
    notes: "Approved Figma prototype handover payout",
  },
  {
    id: "e-4",
    bookId: "book-1",
    date: "2026-09-02",
    description: "WeWork Private Office Space Rent",
    amount: 45000,
    type: "expense",
    category: "Office & Coworking",
    categoryColor: "#ec4899",
    paymentMode: "Bank",
    party: "WeWork India",
    notes: "Dedicated 6-desk cabin for Sep 2026",
  },
  {
    id: "e-5",
    bookId: "book-1",
    date: "2026-09-01",
    description: "Senior Frontend Contractor Stipend",
    amount: 75000,
    type: "expense",
    category: "Team & Contractors",
    categoryColor: "#f59e0b",
    paymentMode: "Bank",
    party: "Rohan Varma",
    notes: "Next.js & Supabase contract deliverables",
  },
  {
    id: "e-6",
    bookId: "book-1",
    date: "2026-08-30",
    description: "Figma Organization Annual Seat License",
    amount: 14400,
    type: "expense",
    category: "Software Subscriptions",
    categoryColor: "#8b5cf6",
    paymentMode: "Card",
    party: "Figma Inc.",
    notes: "Annual renewal for 4 team seats",
  },
  {
    id: "e-7",
    bookId: "book-1",
    date: "2026-08-28",
    description: "Brand Identity Workshop Payout",
    amount: 90000,
    type: "income",
    category: "Design Projects",
    categoryColor: "#06b6d4",
    paymentMode: "UPI",
    party: "VentureCraft Studio",
    notes: "Received via UPI to business VPA",
  },
  {
    id: "e-8",
    bookId: "book-1",
    date: "2026-08-27",
    description: "Google Workspace & Custom Domain",
    amount: 3200,
    type: "expense",
    category: "Software Subscriptions",
    categoryColor: "#8b5cf6",
    paymentMode: "Card",
    party: "Google LLC",
    notes: "Email suites & 2TB Drive workspace",
  },
  {
    id: "e-9",
    bookId: "book-1",
    date: "2026-08-25",
    description: "Client Dinner & Project Strategy Meeting",
    amount: 6850,
    type: "expense",
    category: "Travel & Meals",
    categoryColor: "#f43f5e",
    paymentMode: "Card",
    party: "The Oberoi Grand",
    notes: "Signed quarterly contract agreement",
  },
  {
    id: "e-10",
    bookId: "book-1",
    date: "2026-08-22",
    description: "Website Performance Audit & SEO Retainer",
    amount: 65000,
    type: "income",
    category: "Client Retainer",
    categoryColor: "#10b981",
    paymentMode: "Bank",
    party: "OmniHealth Clinic",
    notes: "Direct bank transfer",
  },
  {
    id: "e-11",
    bookId: "book-1",
    date: "2026-08-19",
    description: "GitHub Enterprise & Copilot Team",
    amount: 4800,
    type: "expense",
    category: "Software Subscriptions",
    categoryColor: "#8b5cf6",
    paymentMode: "Card",
    party: "GitHub Inc.",
    notes: "Developer team tooling",
  },
  {
    id: "e-12",
    bookId: "book-1",
    date: "2026-08-15",
    description: "E-Commerce Replatforming Advance",
    amount: 180000,
    type: "income",
    category: "Design Projects",
    categoryColor: "#06b6d4",
    paymentMode: "Bank",
    party: "UrbanKrafts Retail",
    notes: "First installment 40% advance milestone",
  },
]

const CASH_FLOW_CHART_DATA = [
  { date: "Aug 10", income: 45000, expense: 12000, net: 33000 },
  { date: "Aug 15", income: 180000, expense: 28000, net: 152000 },
  { date: "Aug 20", income: 65000, expense: 19500, net: 45500 },
  { date: "Aug 25", income: 90000, expense: 24350, net: 65650 },
  { date: "Aug 30", income: 110000, expense: 48200, net: 61800 },
  { date: "Sep 02", income: 145000, expense: 124000, net: 21000 },
  { date: "Sep 05", income: 220000, expense: 38450, net: 181550 },
]

const CATEGORY_CHART_DATA = [
  { name: "Client Retainers", value: 375000, color: "#10b981" },
  { name: "Design Projects", value: 415000, color: "#06b6d4" },
  { name: "Team Payroll", value: 165000, color: "#f59e0b" },
  { name: "Office Rent", value: 95000, color: "#ec4899" },
  { name: "Cloud & Hosting", value: 48500, color: "#6366f1" },
  { name: "Software Tools", value: 34200, color: "#8b5cf6" },
  { name: "Client Travel", value: 24800, color: "#f43f5e" },
]

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val)
}

function DemoViewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "dashboard"

  const [activeTab, setActiveTab] = useState<"dashboard" | "ledger" | "books" | "reports">(
    initialTab as any
  )
  const [selectedBook, setSelectedBook] = useState<MockBook>(MOCK_BOOKS[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
  const [reportType, setReportType] = useState<"all" | "day" | "category">("all")
  const [timeRange, setTimeRange] = useState("this-month")
  const [chartType, setChartType] = useState<"area" | "bar">("area")
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Filter entries
  const filteredEntries = useMemo(() => {
    return MOCK_ENTRIES.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.party && e.party.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      )
    })
  }, [typeFilter, searchQuery])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Demo Mode Announcement Header */}
      <div className="sticky top-0 z-50 border-b border-primary/20 bg-primary/95 backdrop-blur-md text-primary-foreground px-4 py-2.5">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Interactive Live Demo</span>
            <span className="hidden md:inline text-primary-foreground/80">
              — Experience Ledgerly with simulated business finances & audit reports.
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="px-2.5 py-1 text-xs font-medium text-primary-foreground/90 hover:text-white transition-colors"
            >
              ← Back to Landing Page
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-bold text-primary shadow-sm hover:bg-white/90 transition-all"
            >
              Start Free Account
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main App Bar */}
      <header className="border-b border-border/80 bg-card/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <img
                src="/Ledgerly.png"
                alt="Ledgerly"
                className="h-9 w-9 rounded-xl object-cover shadow-xs"
              />
              <span className="text-xl font-bold tracking-tight">Ledgerly</span>
            </Link>

            <div className="hidden h-5 w-px bg-border sm:block" />

            {/* Active Book Selector */}
            <div className="relative group">
              <button className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/50 px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedBook.color }} />
                <span className="truncate max-w-[160px] sm:max-w-[200px]">{selectedBook.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* End-to-End Encryption Badge */}
            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:flex shadow-2xs select-none">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>End-to-End Encrypted (AES-256)</span>
            </div>

            <Link
              href="/signup"
              className="rounded-lg bg-primary px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
            >
              Sign Up Free
            </Link>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="border-t border-border/60 bg-muted/30 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl flex items-center gap-2 sm:gap-4 overflow-x-auto py-2 scrollbar-none">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "bg-card text-primary shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "ledger"
                  ? "bg-card text-primary shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Ledger Book
              <span className="rounded-full bg-primary/15 px-1.5 py-0.2 text-[11px] font-bold text-primary">
                {MOCK_ENTRIES.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("books")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "books"
                  ? "bg-card text-primary shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Wallet className="h-4 w-4" />
              All Books
              <span className="rounded-full bg-muted px-1.5 py-0.2 text-[11px] font-bold text-muted-foreground">
                {MOCK_BOOKS.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "reports"
                  ? "bg-card text-primary shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <FileText className="h-4 w-4" />
              Reports & Audit
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast Alert Simulation */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-card border border-primary/30 p-4 shadow-xl text-foreground text-sm font-medium animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* -------------------- TAB 1: DASHBOARD -------------------- */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Financial Intelligence</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
                  Analytics & Overview
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg border border-border bg-secondary/30 p-1">
                  <button
                    onClick={() => setTimeRange("this-month")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      timeRange === "this-month"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setTimeRange("last-3-months")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      timeRange === "last-3-months"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Last 3 Months
                  </button>
                  <button
                    onClick={() => setTimeRange("this-year")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      timeRange === "this-year"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    This Year
                  </button>
                </div>

                <div className="inline-flex rounded-lg border border-border bg-secondary/30 p-1">
                  <button
                    onClick={() => setChartType("area")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      chartType === "area"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartType("bar")}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      chartType === "bar"
                        ? "bg-card text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Bar
                  </button>
                </div>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-primary" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Net Current Balance
                    </CardTitle>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {formatINR(selectedBook.balance)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>+18.4% vs previous month</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total Inflow (Income)
                    </CardTitle>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <ArrowDownRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {formatINR(selectedBook.totalIncome)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>14 client invoices cleared</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-rose-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total Outflow (Expenses)
                    </CardTitle>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                    {formatINR(selectedBook.totalExpense)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Within projected burn rate</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/80 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 w-full bg-indigo-500" />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Net Savings Rate
                    </CardTitle>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl sm:text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
                    56.8%
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span>High financial health index</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visual Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Cash Flow Timeline Chart */}
              <Card className="lg:col-span-2 border-border/80 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Cash Flow Trajectory</CardTitle>
                      <CardDescription>Income vs expenses comparison over timeline</CardDescription>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                        <span>Income</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 rounded-sm bg-rose-500" />
                        <span>Expense</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "area" ? (
                        <AreaChart data={CASH_FLOW_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                          <Tooltip
                            formatter={(value: any) => [formatINR(Number(value)), ""]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
                          />
                          <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" />
                          <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
                        </AreaChart>
                      ) : (
                        <BarChart data={CASH_FLOW_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                          <Tooltip formatter={(value: any) => [formatINR(Number(value)), ""]} />
                          <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Spending Breakdown */}
              <Card className="border-border/80 shadow-xs flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Category Breakdown</CardTitle>
                  <CardDescription>Major capital allocations this period</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={CATEGORY_CHART_DATA}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={3}
                        >
                          {CATEGORY_CHART_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [formatINR(Number(value)), ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Legend List */}
                  <div className="space-y-2 mt-3 pt-3 border-t border-border/60 max-h-36 overflow-y-auto pr-1">
                    {CATEGORY_CHART_DATA.slice(0, 4).map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="font-medium truncate max-w-[130px]">{cat.name}</span>
                        </div>
                        <span className="font-semibold text-muted-foreground">{formatINR(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent High-Priority Transactions */}
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Recent High-Value Transactions</CardTitle>
                  <CardDescription>Real-time encrypted entries logged across books</CardDescription>
                </div>
                <button
                  onClick={() => setActiveTab("ledger")}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  View full ledger →
                </button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/60">
                  {MOCK_ENTRIES.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                            entry.type === "income"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {entry.type === "income" ? (
                            <ArrowDownRight className="h-5 w-5" />
                          ) : (
                            <ArrowUpRight className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{entry.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{entry.date}</span>
                            <span>•</span>
                            <span
                              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                              style={{
                                backgroundColor: `${entry.categoryColor}15`,
                                color: entry.categoryColor,
                              }}
                            >
                              {entry.category}
                            </span>
                            {entry.party && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[120px]">{entry.party}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm sm:text-base font-bold ${
                            entry.type === "income"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {entry.type === "income" ? "+" : "-"}
                          {formatINR(entry.amount)}
                        </span>
                        <p className="text-[11px] text-muted-foreground font-mono">{entry.paymentMode}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* -------------------- TAB 2: LEDGER -------------------- */}
        {activeTab === "ledger" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Toolbar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Master Register</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
                  Ledger Transactions
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Viewing entries for <strong className="text-foreground">{selectedBook.name}</strong> (Running balance: {formatINR(selectedBook.balance)})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => showToast("Simulated: Income entry added with client-side AES-256 encryption!")}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Cash In
                </Button>
                <Button
                  onClick={() => showToast("Simulated: Expense entry logged and vault updated!")}
                  className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  <Minus className="h-4 w-4" />
                  Cash Out
                </Button>
              </div>
            </div>

            {/* Filter Bar Card */}
            <Card className="border-border/80 shadow-xs p-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by description, party, notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                  <div className="inline-flex rounded-lg border border-border bg-secondary/30 p-1">
                    <button
                      onClick={() => setTypeFilter("all")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        typeFilter === "all" ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                      }`}
                    >
                      All ({MOCK_ENTRIES.length})
                    </button>
                    <button
                      onClick={() => setTypeFilter("income")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        typeFilter === "income" ? "bg-card text-emerald-600 shadow-2xs" : "text-muted-foreground"
                      }`}
                    >
                      Inflow (+)
                    </button>
                    <button
                      onClick={() => setTypeFilter("expense")}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        typeFilter === "expense" ? "bg-card text-rose-600 shadow-2xs" : "text-muted-foreground"
                      }`}
                    >
                      Outflow (-)
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={() => {
                      setSearchQuery("")
                      setTypeFilter("all")
                      showToast("Filters reset to default view")
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            {/* Ledger Table */}
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border/80">
                    <tr>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Description & Details</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Payment Mode</th>
                      <th className="py-3.5 px-4 text-right">Inflow (+)</th>
                      <th className="py-3.5 px-4 text-right">Outflow (-)</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-medium">
                    {filteredEntries.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        onClick={() => showToast(`Selected: "${entry.description}" — Notes: ${entry.notes || "None"}`)}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground text-xs font-mono">
                          {entry.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-foreground">{entry.description}</div>
                          {entry.party && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span>Party: {entry.party}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: `${entry.categoryColor}15`,
                              color: entry.categoryColor,
                            }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.categoryColor }} />
                            {entry.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded border border-border/80 px-2 py-0.5 text-xs text-muted-foreground font-mono">
                            <CreditCard className="h-3 w-3" />
                            {entry.paymentMode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {entry.type === "income" ? `+${formatINR(entry.amount)}` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          {entry.type === "expense" ? `-${formatINR(entry.amount)}` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              showToast(`Viewing encrypted metadata for entry: ${entry.id}`)
                            }}
                          >
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* -------------------- TAB 3: ALL BOOKS -------------------- */}
        {activeTab === "books" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Multi-Tenant Vaults</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
                  Ledgerly Books
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Keep separate books for each business entity, consulting practice, or personal venture.
                </p>
              </div>

              <Button
                onClick={() => showToast("Simulated: New book created with dedicated AES-256 encryption partition!")}
                className="gap-2 font-semibold shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Create New Book
              </Button>
            </div>

            {/* Grid of Books */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {MOCK_BOOKS.map((book) => {
                const isSelected = selectedBook.id === book.id
                return (
                  <Card
                    key={book.id}
                    className={`border transition-all hover:shadow-md ${
                      isSelected ? "border-primary ring-2 ring-primary/20 bg-card" : "border-border/80 bg-card/60"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 items-center justify-center rounded-xl text-white font-bold text-lg shadow-2xs"
                            style={{ backgroundColor: book.color }}
                          >
                            {book.name.charAt(0)}
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                              {book.name}
                              {isSelected && (
                                <Badge variant="secondary" className="text-[10px] font-bold text-primary">
                                  Active Book
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-1 mt-0.5">
                              {book.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="rounded-xl bg-secondary/40 p-4 border border-border/40">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Net Book Balance
                        </div>
                        <div className="text-2xl font-bold tracking-tight mt-1 text-foreground">
                          {formatINR(book.balance)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/60 text-xs">
                          <div>
                            <span className="text-muted-foreground">Inflow: </span>
                            <span className="font-semibold text-emerald-600">+{formatINR(book.totalIncome)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Outflow: </span>
                            <span className="font-semibold text-rose-600">-{formatINR(book.totalExpense)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span>{book.entryCount} encrypted entries</span>
                        <span>Active {book.lastActive}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          onClick={() => {
                            setSelectedBook(book)
                            showToast(`Selected book: ${book.name}. Cash In window simulated.`)
                          }}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          In
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                          onClick={() => {
                            setSelectedBook(book)
                            showToast(`Selected book: ${book.name}. Cash Out window simulated.`)
                          }}
                        >
                          <Minus className="h-3.5 w-3.5 mr-1" />
                          Out
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs font-semibold"
                          onClick={() => {
                            setSelectedBook(book)
                            setActiveTab("ledger")
                          }}
                        >
                          Open Ledger →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* -------------------- TAB 4: REPORTS -------------------- */}
        {activeTab === "reports" && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Financial Audits</p>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-0.5">
                  Reports & Statements
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Generate verified, exportable statements for tax filing, investors, or accountant review.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => showToast("Simulated: Exporting CSV statement for Acme Studio...")}
                  className="gap-2 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
                <Button
                  onClick={() => showToast("Simulated: Generating audit-ready PDF statement with cryptographic watermark...")}
                  className="gap-2 text-xs font-semibold shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Download PDF Statement
                </Button>
              </div>
            </div>

            {/* Filter Control Card */}
            <Card className="border-border/80 shadow-xs p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Selected Book</label>
                  <div className="mt-1.5 font-bold text-sm text-foreground bg-secondary/50 px-3 py-2 rounded-lg border border-border/80">
                    {selectedBook.name}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Statement Period</label>
                  <div className="mt-1.5 font-bold text-sm text-foreground bg-secondary/50 px-3 py-2 rounded-lg border border-border/80">
                    Q3 Financial Year (Jul - Sep 2026)
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Report Breakdown Type</label>
                  <div className="mt-1.5 flex gap-1">
                    <button
                      onClick={() => setReportType("all")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        reportType === "all"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      All Entries
                    </button>
                    <button
                      onClick={() => setReportType("category")}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        reportType === "category"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      By Category
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Summary Banner Card */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border/80 shadow-xs p-4 bg-card">
                <p className="text-xs uppercase font-semibold text-muted-foreground">Opening Balance</p>
                <p className="text-xl font-bold mt-1 text-foreground">₹2,18,000</p>
                <p className="text-xs text-muted-foreground mt-0.5">As of Jul 01, 2026</p>
              </Card>

              <Card className="border-border/80 shadow-xs p-4 bg-card">
                <p className="text-xs uppercase font-semibold text-muted-foreground">Net Period Cashflow</p>
                <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                  +{formatINR(selectedBook.totalIncome - selectedBook.totalExpense)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Inflow - Outflow</p>
              </Card>

              <Card className="border-border/80 shadow-xs p-4 bg-card">
                <p className="text-xs uppercase font-semibold text-muted-foreground">Closing Audit Balance</p>
                <p className="text-xl font-bold mt-1 text-primary">
                  {formatINR(selectedBook.balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Reconciled with bank statements</p>
              </Card>
            </div>

            {/* Statement Preview Table */}
            <Card className="border-border/80 shadow-xs overflow-hidden">
              <div className="border-b border-border/80 bg-muted/40 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">Statement Ledger Summary</span>
                </div>
                <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Cryptographic Hash: #8F9A-44C1
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/20 text-xs uppercase font-semibold text-muted-foreground border-b border-border/80">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Transaction / Particulars</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 text-right">Debit (₹)</th>
                      <th className="py-3 px-4 text-right">Credit (₹)</th>
                      <th className="py-3 px-4 text-right">Running Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {MOCK_ENTRIES.map((entry, i) => (
                      <tr key={entry.id} className="hover:bg-muted/30 text-xs font-medium">
                        <td className="py-3 px-4 text-muted-foreground font-mono">{entry.date}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">{entry.description}</td>
                        <td className="py-3 px-4">
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{
                              backgroundColor: `${entry.categoryColor}15`,
                              color: entry.categoryColor,
                            }}
                          >
                            {entry.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 font-bold">
                          {entry.type === "expense" ? formatINR(entry.amount) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                          {entry.type === "income" ? formatINR(entry.amount) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                          {formatINR(482500 - i * 14500)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Demo Footer */}
      <footer className="border-t border-border/80 bg-card py-6 px-4 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Ledgerly Technologies. Sample data provided for preview purposes.</p>
          <div className="flex items-center gap-4 font-semibold">
            <Link href="/" className="hover:text-foreground">Landing Page</Link>
            <Link href="/login" className="hover:text-foreground">Sign In</Link>
            <Link href="/signup" className="text-primary hover:underline">Start Free Account →</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading Ledgerly Demo...</div>}>
      <DemoViewContent />
    </Suspense>
  )
}

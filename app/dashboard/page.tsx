"use client"

import React, { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { getCurrentUser } from "@/lib/auth"
import { getBooks, getEntries, getCategories } from "@/lib/store"
import { Book, Entry, Category } from "@/lib/types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  CreditCard,
  Sparkles,
  Percent,
  CalendarDays,
  CalendarRange,
  ShieldCheck,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import {
  format,
  subMonths,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO,
  differenceInDays,
  differenceInMonths,
} from "date-fns"

const PALETTE = [
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#14b8a6", // Teal
  "#f43f5e", // Rose
  "#84cc16", // Lime
]

type TimeRangePreset =
  | "this-month"
  | "last-month"
  | "last-3-months"
  | "last-6-months"
  | "this-year"
  | "all-time"
  | "custom"

type GroupBy = "daily" | "weekly" | "monthly"

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookIdParam = searchParams.get("bookId")

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string>(bookIdParam || "all")
  const [timeRange, setTimeRange] = useState<TimeRangePreset>("this-month")
  const [groupBy, setGroupBy] = useState<GroupBy>("daily")
  const [chartType, setChartType] = useState<"area" | "bar">("area")

  // Custom date range
  const now = new Date()
  const [customStart, setCustomStart] = useState(format(startOfMonth(now), "yyyy-MM-dd"))
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(now), "yyyy-MM-dd"))

  // All decrypted data in memory
  const [allEntries, setAllEntries] = useState<{ bookId: string; entry: Entry }[]>([])
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category>>({})

  // Load user data
  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      setUserId(user.id)
      const userBooks = await getBooks(user.id)
      if (userBooks.length === 0) {
        router.push("/books")
        return
      }

      setBooks(userBooks)

      // Fetch entries & categories across all books
      const entriesAccumulator: { bookId: string; entry: Entry }[] = []
      const catMap: Record<string, Category> = {}

      for (const book of userBooks) {
        const [bookEntries, bookCategories] = await Promise.all([
          getEntries(book.id, user.id),
          getCategories(book.id, user.id),
        ])

        bookEntries.forEach((e) => entriesAccumulator.push({ bookId: book.id, entry: e }))
        bookCategories.forEach((c) => {
          catMap[c.id] = c
        })
      }

      setAllEntries(entriesAccumulator)
      setCategoriesMap(catMap)
      setLoading(false)
    }

    init()
  }, [router])

  // Compute Active Date Range Intervals
  const { currentInterval, previousInterval, periodDays, periodMonths } = useMemo(() => {
    const today = new Date()
    let start: Date
    let end: Date
    let prevStart: Date
    let prevEnd: Date

    switch (timeRange) {
      case "this-month":
        start = startOfMonth(today)
        end = endOfMonth(today)
        prevStart = startOfMonth(subMonths(today, 1))
        prevEnd = endOfMonth(subMonths(today, 1))
        break
      case "last-month":
        start = startOfMonth(subMonths(today, 1))
        end = endOfMonth(subMonths(today, 1))
        prevStart = startOfMonth(subMonths(today, 2))
        prevEnd = endOfMonth(subMonths(today, 2))
        break
      case "last-3-months":
        start = subMonths(today, 3)
        end = today
        prevStart = subMonths(start, 3)
        prevEnd = start
        break
      case "last-6-months":
        start = subMonths(today, 6)
        end = today
        prevStart = subMonths(start, 6)
        prevEnd = start
        break
      case "this-year":
        start = startOfYear(today)
        end = endOfYear(today)
        prevStart = startOfYear(subMonths(today, 12))
        prevEnd = endOfYear(subMonths(today, 12))
        break
      case "custom":
        start = new Date(`${customStart}T00:00:00`)
        end = new Date(`${customEnd}T23:59:59`)
        const diff = differenceInDays(end, start) || 1
        prevStart = subDays(start, diff)
        prevEnd = start
        break
      case "all-time":
      default:
        start = new Date(2000, 0, 1)
        end = new Date(2100, 0, 1)
        prevStart = new Date(1900, 0, 1)
        prevEnd = new Date(1999, 11, 31)
        break
    }

    const days = Math.max(1, differenceInDays(end > today ? today : end, start) + 1)
    const months = Math.max(1, (days / 30.4375))

    return {
      currentInterval: { start, end },
      previousInterval: { start: prevStart, end: prevEnd },
      periodDays: days,
      periodMonths: months,
    }
  }, [timeRange, customStart, customEnd])

  // Filtered Entries for Selected Book and Time Range
  const { currentEntries, previousEntries } = useMemo(() => {
    const filteredByBook =
      selectedBookId === "all"
        ? allEntries
        : allEntries.filter((item) => item.bookId === selectedBookId)

    const curr: Entry[] = []
    const prev: Entry[] = []

    filteredByBook.forEach(({ entry }) => {
      const entryDate = parseISO(entry.occurredAt || entry.date)
      if (
        isWithinInterval(entryDate, {
          start: currentInterval.start,
          end: currentInterval.end,
        })
      ) {
        curr.push(entry)
      } else if (
        isWithinInterval(entryDate, {
          start: previousInterval.start,
          end: previousInterval.end,
        })
      ) {
        prev.push(entry)
      }
    })

    return { currentEntries: curr, previousEntries: prev }
  }, [allEntries, selectedBookId, currentInterval, previousInterval])

  // KPI Calculations
  const kpi = useMemo(() => {
    const totalIncome = currentEntries
      .filter((e) => e.type === "income")
      .reduce((acc, e) => acc + e.amount, 0)
    const totalExpense = currentEntries
      .filter((e) => e.type === "expense")
      .reduce((acc, e) => acc + e.amount, 0)
    const netSavings = totalIncome - totalExpense
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

    const prevIncome = previousEntries
      .filter((e) => e.type === "income")
      .reduce((acc, e) => acc + e.amount, 0)
    const prevExpense = previousEntries
      .filter((e) => e.type === "expense")
      .reduce((acc, e) => acc + e.amount, 0)

    const incomeDelta =
      prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null
    const expenseDelta =
      prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : null

    const avgDailySpend = totalExpense / periodDays
    const avgMonthlySpend = totalExpense / periodMonths

    // Top Expense Category
    const categoryTotals: Record<string, number> = {}
    currentEntries
      .filter((e) => e.type === "expense")
      .forEach((e) => {
        const catName = (e.categoryId && categoriesMap[e.categoryId]?.name) || "Uncategorized"
        categoryTotals[catName] = (categoryTotals[catName] || 0) + e.amount
      })

    let topCategory = { name: "None", amount: 0, percentage: 0 }
    Object.entries(categoryTotals).forEach(([name, amount]) => {
      if (amount > topCategory.amount) {
        topCategory = {
          name,
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
        }
      }
    })

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      incomeDelta,
      expenseDelta,
      avgDailySpend,
      avgMonthlySpend,
      topCategory,
      entryCount: currentEntries.length,
    }
  }, [currentEntries, previousEntries, periodDays, periodMonths, categoriesMap])

  // Trend Data for Area / Bar Chart
  const trendData = useMemo(() => {
    const buckets: Record<string, { dateLabel: string; income: number; expense: number; net: number; timestamp: number }> = {}

    currentEntries.forEach((entry) => {
      const entryDate = parseISO(entry.occurredAt || entry.date)
      let key = ""
      let dateLabel = ""

      if (groupBy === "daily") {
        key = format(entryDate, "yyyy-MM-dd")
        dateLabel = format(entryDate, "MMM dd")
      } else if (groupBy === "weekly") {
        key = format(entryDate, "yyyy-'W'ww")
        dateLabel = `Wk ${format(entryDate, "ww, MMM")}`
      } else {
        key = format(entryDate, "yyyy-MM")
        dateLabel = format(entryDate, "MMM yyyy")
      }

      if (!buckets[key]) {
        buckets[key] = {
          dateLabel,
          income: 0,
          expense: 0,
          net: 0,
          timestamp: entryDate.getTime(),
        }
      }

      if (entry.type === "income") {
        buckets[key].income += entry.amount
        buckets[key].net += entry.amount
      } else {
        buckets[key].expense += entry.amount
        buckets[key].net -= entry.amount
      }
    })

    return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp)
  }, [currentEntries, groupBy])

  // Category Breakdown for Donut Chart
  const categoryData = useMemo(() => {
    const catMap: Record<string, { name: string; value: number; color: string; count: number }> = {}

    currentEntries
      .filter((e) => e.type === "expense")
      .forEach((e) => {
        const cat = e.categoryId ? categoriesMap[e.categoryId] : null
        const name = cat?.name || "Uncategorized"
        const color = cat?.color || PALETTE[Object.keys(catMap).length % PALETTE.length]

        if (!catMap[name]) {
          catMap[name] = { name, value: 0, color, count: 0 }
        }
        catMap[name].value += e.amount
        catMap[name].count += 1
      })

    const total = Object.values(catMap).reduce((sum, item) => sum + item.value, 0)
    return Object.values(catMap)
      .map((item) => ({
        ...item,
        percentage: total > 0 ? (item.value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [currentEntries, categoriesMap])

  // Month-over-Month (MoM) Bar Chart Data (Last 6 Calendar Months)
  const momData = useMemo(() => {
    const filteredByBook =
      selectedBookId === "all"
        ? allEntries
        : allEntries.filter((item) => item.bookId === selectedBookId)

    const months: Record<string, { month: string; income: number; expense: number; net: number; order: number }> = {}

    // Initialize last 6 months in chronological order
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i)
      const key = format(d, "yyyy-MM")
      months[key] = {
        month: format(d, "MMM yyyy"),
        income: 0,
        expense: 0,
        net: 0,
        order: d.getTime(),
      }
    }

    filteredByBook.forEach(({ entry }) => {
      const entryDate = parseISO(entry.occurredAt || entry.date)
      const key = format(entryDate, "yyyy-MM")
      if (months[key]) {
        if (entry.type === "income") {
          months[key].income += entry.amount
          months[key].net += entry.amount
        } else {
          months[key].expense += entry.amount
          months[key].net -= entry.amount
        }
      }
    })

    return Object.values(months).sort((a, b) => a.order - b.order)
  }, [allEntries, selectedBookId])

  // Payment Mode Breakdown
  const paymentModeData = useMemo(() => {
    const modes: Record<string, { name: string; value: number }> = {}

    currentEntries.forEach((e) => {
      const mode = (e.paymentMode || "Cash").toUpperCase()
      if (!modes[mode]) {
        modes[mode] = { name: mode, value: 0 }
      }
      modes[mode].value += e.amount
    })

    return Object.values(modes).sort((a, b) => b.value - a.value)
  }, [currentEntries])

  // Largest Expenses
  const topTransactions = useMemo(() => {
    return currentEntries
      .filter((e) => e.type === "expense")
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
  }, [currentEntries])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm font-medium">Loading analytics dashboard...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader activeBookId={selectedBookId === "all" ? null : selectedBookId} />

      <main className="flex-1 overflow-auto p-4 pb-16 md:p-7 md:pb-16">
        <div className="mx-auto max-w-7xl space-y-7">
          {/* Header & Controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/books")}
                className="h-10 w-10 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Financial Intelligence</p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Book Selector */}
              <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                <SelectTrigger className="w-[180px] bg-card border-border/80 h-10 text-xs font-medium">
                  <Layers className="h-3.5 w-3.5 text-primary mr-1.5 shrink-0" />
                  <SelectValue placeholder="Select Book" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-semibold text-primary">
                    All Books (Consolidated)
                  </SelectItem>
                  {books.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Time Range Preset */}
              <Select value={timeRange} onValueChange={(val) => setTimeRange(val as TimeRangePreset)}>
                <SelectTrigger className="w-[150px] bg-card border-border/80 h-10 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5 text-primary mr-1.5 shrink-0" />
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="this-year">This Year (YTD)</SelectItem>
                  <SelectItem value="all-time">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom Date Pickers (Shown only when custom is selected) */}
              {timeRange === "custom" && (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="h-10 text-xs w-[130px] bg-card"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="h-10 text-xs w-[130px] bg-card"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Top KPI Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Total Inflow */}
            <Card className="border-border/80 bg-card/90 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Income
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(kpi.totalIncome)}
                </div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  {kpi.incomeDelta !== null ? (
                    <span
                      className={`flex items-center font-semibold mr-1.5 ${
                        kpi.incomeDelta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {kpi.incomeDelta >= 0 ? "+" : ""}
                      {kpi.incomeDelta.toFixed(1)}%
                    </span>
                  ) : null}
                  <span>vs prev period</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Outflow */}
            <Card className="border-border/80 bg-card/90 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-rose-500/10 blur-xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Expense
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                  {formatCurrency(kpi.totalExpense)}
                </div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  {kpi.expenseDelta !== null ? (
                    <span
                      className={`flex items-center font-semibold mr-1.5 ${
                        kpi.expenseDelta <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {kpi.expenseDelta >= 0 ? "+" : ""}
                      {kpi.expenseDelta.toFixed(1)}%
                    </span>
                  ) : null}
                  <span>vs prev period</span>
                </div>
              </CardContent>
            </Card>

            {/* Net Savings */}
            <Card className="border-border/80 bg-card/90 shadow-sm relative overflow-hidden">
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/10 blur-xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Net Savings
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-extrabold ${
                    kpi.netSavings >= 0 ? "text-primary" : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {formatCurrency(kpi.netSavings)}
                </div>
                <div className="mt-1 flex items-center text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground mr-1">
                    {kpi.savingsRate.toFixed(0)}%
                  </span>
                  <span>savings rate</span>
                </div>
              </CardContent>
            </Card>

            {/* Avg Daily & Monthly Spend */}
            <Card className="border-border/80 bg-card/90 shadow-sm relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Daily & Monthly
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold text-foreground">
                  {formatCurrency(kpi.avgDailySpend)}
                  <span className="text-xs font-medium text-muted-foreground ml-1">/day</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground mr-1">
                    {formatCurrency(kpi.avgMonthlySpend)}
                  </span>
                  <span>/month run rate</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Spending Category */}
            <Card className="border-border/80 bg-card/90 shadow-sm relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Top Category
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <PieIcon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold truncate text-foreground" title={kpi.topCategory.name}>
                  {kpi.topCategory.name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground mr-1">
                    {formatCurrency(kpi.topCategory.amount)}
                  </span>
                  <span>({kpi.topCategory.percentage.toFixed(0)}% of expenses)</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Visualizations Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cash Flow Trends Chart (2 Columns Wide) */}
            <Card className="border-border/80 bg-card/90 shadow-sm lg:col-span-2">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-3">
                <div>
                  <CardTitle className="text-lg font-bold">Cash Flow Trend</CardTitle>
                  <CardDescription>Income vs. Expense over the active timeframe</CardDescription>
                </div>

                {/* Granularity & Chart Type Controls */}
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-border/80 p-0.5 bg-muted/40 text-xs">
                    {(["daily", "weekly", "monthly"] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGroupBy(g)}
                        className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                          groupBy === g
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>

                  <div className="flex rounded-lg border border-border/80 p-0.5 bg-muted/40 text-xs">
                    <button
                      type="button"
                      onClick={() => setChartType("area")}
                      className={`px-2 py-1 rounded-md font-medium transition-colors ${
                        chartType === "area"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Area
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartType("bar")}
                      className={`px-2 py-1 rounded-md font-medium transition-colors ${
                        chartType === "bar"
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Bar
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {trendData.length === 0 ? (
                  <div className="flex h-[320px] items-center justify-center text-xs text-muted-foreground">
                    No transaction data for this timeframe.
                  </div>
                ) : (
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "area" ? (
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                          <XAxis
                            dataKey="dateLabel"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                            tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              borderColor: "var(--border)",
                              borderRadius: "0.75rem",
                              fontSize: "12px",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                            }}
                            formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                          />
                          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                          <Area
                            type="monotone"
                            dataKey="income"
                            name="Income"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#incomeGrad)"
                          />
                          <Area
                            type="monotone"
                            dataKey="expense"
                            name="Expense"
                            stroke="#f43f5e"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#expenseGrad)"
                          />
                        </AreaChart>
                      ) : (
                        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                          <XAxis
                            dataKey="dateLabel"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                            tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              borderColor: "var(--border)",
                              borderRadius: "0.75rem",
                              fontSize: "12px",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                            }}
                            formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                          />
                          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expense by Category (Donut Chart) */}
            <Card className="border-border/80 bg-card/90 shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Expenses by Category</CardTitle>
                <CardDescription>Category distribution of all expenses</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {categoryData.length === 0 ? (
                  <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">
                    No expense records found.
                  </div>
                ) : (
                  <>
                    <div className="h-[200px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              borderColor: "var(--border)",
                              borderRadius: "0.75rem",
                              fontSize: "12px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Category Percentage List */}
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {categoryData.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="truncate font-medium text-foreground">{cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono shrink-0">
                            <span className="font-semibold text-foreground">{formatCurrency(cat.value)}</span>
                            <span className="text-muted-foreground text-[11px]">({cat.percentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Secondary Visualizations: MoM Comparison & Payment Modes */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Month-over-Month Grouped Bar Chart */}
            <Card className="border-border/80 bg-card/90 shadow-sm lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Month-over-Month Comparison</CardTitle>
                <CardDescription>Income, Expense, and Net performance over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={momData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
                        tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                      />
                      <Tooltip
                        formatter={(value: any) => [formatCurrency(Number(value) || 0), ""]}
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          borderColor: "var(--border)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                      <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net" name="Net Cash Flow" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Mode Distribution */}
            <Card className="border-border/80 bg-card/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Payment Modes</CardTitle>
                <CardDescription>Volume across Cash, Bank, UPI, and Cards</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentModeData.length === 0 ? (
                  <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">
                    No payment mode data available.
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    {paymentModeData.map((item, idx) => {
                      const totalVol = paymentModeData.reduce((s, p) => s + p.value, 0)
                      const pct = totalVol > 0 ? (item.value / totalVol) * 100 : 0
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5 text-primary" />
                              {item.name}
                            </span>
                            <span className="font-mono text-muted-foreground">
                              {formatCurrency(item.value)} ({pct.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Transactions in Selected Range */}
          {topTransactions.length > 0 && (
            <Card className="border-border/80 bg-card/90 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold">Largest Expenses in this Period</CardTitle>
                <CardDescription>Major outflows requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {topTransactions.map((entry) => {
                    const cat = entry.categoryId ? categoriesMap[entry.categoryId] : null
                    const entryDate = parseISO(entry.occurredAt || entry.date)
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/40 transition-colors"
                      >
                        <div className="space-y-1 min-w-0 pr-3">
                          <p className="font-bold text-sm truncate text-foreground">
                            {entry.description || "Expense"}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{format(entryDate, "MMM dd, yyyy")}</span>
                            <span>•</span>
                            <span className="truncate">{cat?.name || "Uncategorized"}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono font-extrabold text-sm text-rose-600 dark:text-rose-400">
                            -{formatCurrency(entry.amount)}
                          </p>
                          <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                            {entry.paymentMode || "Cash"}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
          {/* End-to-End Encryption Notice */}
          <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/40 py-3.5 px-4 text-xs text-muted-foreground text-center shadow-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              All financial analytics and metrics are computed <strong className="text-foreground">client-side from End-to-End Encrypted records🔐</strong>. No raw financial data is ever visible to the server.
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </AuthGuard>
  )
}

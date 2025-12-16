"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getBooks, getActiveBookId, setActiveBookId, getEntries, getCategories } from "@/lib/store"
import { ArrowDownRight, ArrowUpRight, IndianRupee, TrendingUp } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { format, subDays } from "date-fns"

export default function DashboardPage() {
  const router = useRouter()
  const [activeBookId, setActiveBookIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ entries: any[]; categories: any[] }>({ entries: [], categories: [] })

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user) return

      const books = await getBooks(user.id)
      if (books.length === 0) {
        router.push("/books")
        return
      }

      let bookId = getActiveBookId()
      if (!bookId || !books.find((b) => b.id === bookId)) {
        bookId = books[0].id
        setActiveBookId(bookId)
      }

      setActiveBookIdState(bookId)
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    const loadData = async () => {
      if (activeBookId) {
        const entries = await getEntries(activeBookId)
        const categories = await getCategories(activeBookId)
        setData({ entries, categories })
      }
    }
    loadData()
  }, [activeBookId])

  if (loading || !activeBookId) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AuthGuard>
    )
  }

  const entries = data.entries
  const categories = data.categories

  const totalIncome = entries.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = entries.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense

  // Chart data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, "yyyy-MM-dd")

    const dayEntries = entries.filter((t) => format(new Date(t.date), "yyyy-MM-dd") === dateStr)

    const income = dayEntries.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const expense = dayEntries.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    return {
      date: format(date, "MMM dd"),
      income,
      expense,
    }
  })

  // Category breakdown - show categories with expenses
  const expensesByCategory = categories
    .map((category) => {
      const expenseTotal = entries
        .filter((t) => t.categoryId === category.id && t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        name: category.name,
        value: expenseTotal,
        color: category.color || "#8b5cf6",
      }
    })
    .filter((c) => c.value > 0)

  const recentEntries = entries.slice(0, 5)

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader activeBookId={activeBookId} onBookChange={() => setLoading(true)} />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background p-4 md:p-6 pb-20 md:pb-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm md:text-base text-muted-foreground">Overview of your financial activity</p>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{balance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Current book balance</p>
                  </CardContent>
                </Card> */}

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">₹{totalIncome.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {entries.filter((t) => t.type === "income").length} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">₹{totalExpense.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {entries.filter((t) => t.type === "expense").length} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
                      ₹{balance.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Income - Expenses</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">Income & Expenses (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={last7Days}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="income"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          name="Income"
                        />
                        <Line
                          type="monotone"
                          dataKey="expense"
                          stroke="hsl(var(--destructive))"
                          strokeWidth={2}
                          name="Expenses"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expensesByCategory.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={expensesByCategory}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expensesByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number) => `₹${value.toFixed(2)}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                        No expense data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentEntries.length > 0 ? (
                    <div className="space-y-4">
                      {recentEntries.map((entry) => {
                        const category = categories.find((c) => c.id === entry.categoryId)

                        return (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                          >
                            <div className="space-y-1">
                              <div className="font-medium">{entry.description}</div>
                              <div className="text-sm text-muted-foreground">
                                {category?.name} • {entry.paymentMode} •{" "}
                                {format(new Date(entry.date), "MMM dd, yyyy")}
                              </div>
                            </div>
                            <div
                              className={`text-lg font-semibold ${entry.type === "income" ? "text-success" : "text-destructive"}`}
                            >
                              {entry.type === "income" ? "+" : "-"}₹{entry.amount.toFixed(2)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                      No transactions yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  )
}

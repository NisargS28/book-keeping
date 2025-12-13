"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getBooks, getActiveBookId, setActiveBookId, getTransactions, getCategories, getAccounts } from "@/lib/store"
import { ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp } from "lucide-react"
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

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) return

    const books = getBooks(user.id)
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
  }, [router])

  if (loading || !activeBookId) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AuthGuard>
    )
  }

  const transactions = getTransactions(activeBookId)
  const categories = getCategories(activeBookId)
  const accounts = getAccounts(activeBookId)

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpense
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  // Chart data for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, "yyyy-MM-dd")

    const dayTransactions = transactions.filter((t) => format(new Date(t.date), "yyyy-MM-dd") === dateStr)

    const income = dayTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const expense = dayTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    return {
      date: format(date, "MMM dd"),
      income,
      expense,
    }
  })

  // Category breakdown for expenses
  const expensesByCategory = categories
    .filter((c) => c.type === "expense")
    .map((category) => {
      const total = transactions.filter((t) => t.categoryId === category.id).reduce((sum, t) => sum + t.amount, 0)

      return {
        name: category.name,
        value: total,
        color: category.color || "#8b5cf6",
      }
    })
    .filter((c) => c.value > 0)

  const recentTransactions = transactions.slice(0, 5)

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader activeBookId={activeBookId} onBookChange={() => setLoading(true)} />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your financial activity</p>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Across all accounts</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">${totalIncome.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {transactions.filter((t) => t.type === "income").length} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">${totalExpense.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {transactions.filter((t) => t.type === "expense").length} transactions
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
                      ${balance.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Income - Expenses</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Income & Expenses (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
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
                            formatter={(value: number) => `$${value.toFixed(2)}`}
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
                  {recentTransactions.length > 0 ? (
                    <div className="space-y-4">
                      {recentTransactions.map((transaction) => {
                        const category = categories.find((c) => c.id === transaction.categoryId)
                        const account = accounts.find((a) => a.id === transaction.accountId)

                        return (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                          >
                            <div className="space-y-1">
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-muted-foreground">
                                {category?.name} • {account?.name} •{" "}
                                {format(new Date(transaction.date), "MMM dd, yyyy")}
                              </div>
                            </div>
                            <div
                              className={`text-lg font-semibold ${transaction.type === "income" ? "text-success" : "text-destructive"}`}
                            >
                              {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
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
      </div>
    </AuthGuard>
  )
}

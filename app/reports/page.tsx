"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getBooks, getActiveBookId, setActiveBookId, getTransactions, getCategories } from "@/lib/store"
import { Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns"

export default function ReportsPage() {
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

  // Calculate totals
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  const netIncome = totalIncome - totalExpense

  // Last 6 months data
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date(),
  })

  const monthlyData = last6Months.map((month) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)

    const monthTransactions = transactions.filter((t) => {
      const date = new Date(t.date)
      return date >= monthStart && date <= monthEnd
    })

    const income = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

    const expense = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

    return {
      month: format(month, "MMM yyyy"),
      income,
      expense,
      net: income - expense,
    }
  })

  // Category breakdown
  const categoryBreakdown = categories
    .map((category) => {
      const total = transactions.filter((t) => t.categoryId === category.id).reduce((sum, t) => sum + t.amount, 0)

      const count = transactions.filter((t) => t.categoryId === category.id).length

      return {
        name: category.name,
        type: category.type,
        total,
        count,
      }
    })
    .filter((c) => c.total > 0)

  const handleExportPDF = () => {
    // TODO: Implement PDF export using jsPDF or similar
    alert("PDF export functionality - TODO: Implement with jsPDF library")
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader activeBookId={activeBookId} onBookChange={() => setLoading(true)} />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background p-6">
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                  <p className="text-muted-foreground">Financial analysis and insights</p>
                </div>
                <Button onClick={handleExportPDF} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              </div>

              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">${totalIncome.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {transactions.filter((t) => t.type === "income").length} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive">${totalExpense.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {transactions.filter((t) => t.type === "expense").length} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${netIncome >= 0 ? "text-success" : "text-destructive"}`}>
                      ${netIncome.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {((netIncome / totalIncome) * 100 || 0).toFixed(1)}% of income
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends (Last 6 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                      <Legend />
                      <Bar dataKey="income" fill="hsl(var(--success))" name="Income" />
                      <Bar dataKey="expense" fill="hsl(var(--destructive))" name="Expenses" />
                      <Bar dataKey="net" fill="hsl(var(--primary))" name="Net" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Income by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryBreakdown.filter((c) => c.type === "income").length > 0 ? (
                      <div className="space-y-4">
                        {categoryBreakdown
                          .filter((c) => c.type === "income")
                          .sort((a, b) => b.total - a.total)
                          .map((cat) => (
                            <div key={cat.name} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{cat.name}</span>
                                <span className="text-success font-semibold">${cat.total.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className="h-full bg-success"
                                    style={{ width: `${(cat.total / totalIncome) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {((cat.total / totalIncome) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center text-muted-foreground">No income data</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryBreakdown.filter((c) => c.type === "expense").length > 0 ? (
                      <div className="space-y-4">
                        {categoryBreakdown
                          .filter((c) => c.type === "expense")
                          .sort((a, b) => b.total - a.total)
                          .map((cat) => (
                            <div key={cat.name} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{cat.name}</span>
                                <span className="text-destructive font-semibold">${cat.total.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className="h-full bg-destructive"
                                    style={{ width: `${(cat.total / totalExpense) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {((cat.total / totalExpense) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="flex h-32 items-center justify-center text-muted-foreground">No expense data</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}

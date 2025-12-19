"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getCurrentUser } from "@/lib/auth"
import { getBooks, getEntries, getCategories } from "@/lib/store"
import { Book, Entry, Category } from "@/lib/types"
import { Download, FileText } from "lucide-react"
import { format } from "date-fns"

type ReportType = "all" | "day-wise" | "category-wise"

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string>("")
  const [reportType, setReportType] = useState<ReportType>("all")
  const [generating, setGenerating] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser()
      if (!user) {
        router.push("/login")
        return
      }

      const userBooks = await getBooks(user.id)
      if (userBooks.length === 0) {
        router.push("/books")
        return
      }

      setBooks(userBooks)
      setSelectedBookId(userBooks[0].id)
      setLoading(false)
    }
    init()
  }, [router])

  useEffect(() => {
    const loadData = async () => {
      if (selectedBookId) {
        const bookEntries = await getEntries(selectedBookId)
        const bookCategories = await getCategories(selectedBookId)
        setEntries(bookEntries)
        setCategories(bookCategories)
      }
    }
    loadData()
  }, [selectedBookId])

  const generatePDF = () => {
    setGenerating(true)

    try {
      const selectedBook = books.find((b) => b.id === selectedBookId)
      if (!selectedBook) return

      // Create a printable HTML content
      let content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${selectedBook.name} - Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            h1 {
              color: #8b5cf6;
              border-bottom: 2px solid #8b5cf6;
              padding-bottom: 10px;
            }
            h2 {
              color: #333;
              margin-top: 30px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            .summary-card {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
            }
            .summary-card h3 {
              margin: 0 0 10px 0;
              color: #666;
              font-size: 14px;
            }
            .summary-card .value {
              font-size: 24px;
              font-weight: bold;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            .income {
              color: #10b981;
            }
            .expense {
              color: #ef4444;
            }
            .group-header {
              background-color: #e5e7eb;
              font-weight: bold;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${selectedBook.name}</h1>
            <p>Report Generated on ${format(new Date(), "MMMM dd, yyyy HH:mm")}</p>
            <p>Report Type: ${reportType === "all" ? "All Entries" : reportType === "day-wise" ? "Day-wise Summary" : "Category-wise Summary"}</p>
          </div>
      `

      const totalIncome = entries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
      const totalExpense = entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
      const balance = totalIncome - totalExpense

      content += `
          <div class="summary">
            <div class="summary-card">
              <h3>Total Income</h3>
              <div class="value income">₹${totalIncome.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <h3>Total Expense</h3>
              <div class="value expense">₹${totalExpense.toFixed(2)}</div>
            </div>
            <div class="summary-card">
              <h3>Net Balance</h3>
              <div class="value" style="color: ${balance >= 0 ? "#10b981" : "#ef4444"}">₹${balance.toFixed(2)}</div>
            </div>
          </div>
      `

      if (reportType === "all") {
        content += `
          <h2>All Entries</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Payment Mode</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Running Balance</th>
              </tr>
            </thead>
            <tbody>
        `
        entries.forEach((entry) => {
          const category = categories.find((c) => c.id === entry.categoryId)
          content += `
              <tr>
                <td>${format(new Date(entry.date), "MMM dd, yyyy HH:mm")}</td>
                <td>${entry.description}</td>
                <td>${category?.name || "N/A"}</td>
                <td>${entry.paymentMode || "N/A"}</td>
                <td class="${entry.type}">${entry.type === "income" ? "Income" : "Expense"}</td>
                <td class="${entry.type}">₹${entry.amount.toFixed(2)}</td>
                <td>₹${entry.runningBalance.toFixed(2)}</td>
              </tr>
          `
        })
        content += `
            </tbody>
          </table>
        `
      } else if (reportType === "day-wise") {
        const entriesByDate = entries.reduce((acc, entry) => {
          const date = format(new Date(entry.date), "yyyy-MM-dd")
          if (!acc[date]) acc[date] = []
          acc[date].push(entry)
          return acc
        }, {} as Record<string, Entry[]>)

        content += `
          <h2>Day-wise Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
        `

        Object.keys(entriesByDate)
          .sort()
          .reverse()
          .forEach((date) => {
            const dayEntries = entriesByDate[date]
            const dayIncome = dayEntries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
            const dayExpense = dayEntries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)

            content += `
              <tr class="group-header">
                <td colspan="5">
                  ${format(new Date(date), "MMMM dd, yyyy")} - 
                  Income: ₹${dayIncome.toFixed(2)} | 
                  Expense: ₹${dayExpense.toFixed(2)} | 
                  Net: ₹${(dayIncome - dayExpense).toFixed(2)}
                </td>
              </tr>
            `

            dayEntries.forEach((entry) => {
              const category = categories.find((c) => c.id === entry.categoryId)
              content += `
                <tr>
                  <td>${format(new Date(entry.date), "HH:mm")}</td>
                  <td>${entry.description}</td>
                  <td>${category?.name || "N/A"}</td>
                  <td class="${entry.type}">${entry.type === "income" ? "Income" : "Expense"}</td>
                  <td class="${entry.type}">₹${entry.amount.toFixed(2)}</td>
                </tr>
              `
            })
          })

        content += `
            </tbody>
          </table>
        `
      } else if (reportType === "category-wise") {
        const entriesByCategory = categories.map((category) => {
          const categoryEntries = entries.filter((e) => e.categoryId === category.id)
          const income = categoryEntries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
          const expense = categoryEntries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
          return {
            category,
            entries: categoryEntries,
            income,
            expense,
            total: income - expense,
          }
        })

        content += `
          <h2>Category-wise Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Payment Mode</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
        `

        entriesByCategory.forEach(({ category, entries: catEntries, income, expense }) => {
          if (catEntries.length === 0) return

          content += `
            <tr class="group-header">
              <td colspan="5">
                ${category.name} - 
                Income: ₹${income.toFixed(2)} | 
                Expense: ₹${expense.toFixed(2)} | 
                Net: ₹${(income - expense).toFixed(2)}
              </td>
            </tr>
          `

          catEntries.forEach((entry) => {
            content += `
              <tr>
                <td>${format(new Date(entry.date), "MMM dd, yyyy HH:mm")}</td>
                <td>${entry.description}</td>
                <td>${entry.paymentMode || "N/A"}</td>
                <td class="${entry.type}">${entry.type === "income" ? "Income" : "Expense"}</td>
                <td class="${entry.type}">₹${entry.amount.toFixed(2)}</td>
              </tr>
            `
          })
        })

        content += `
            </tbody>
          </table>
        `
      }

      content += `
        </body>
        </html>
      `

      // Open print dialog
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(content)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AuthGuard>
    )
  }

  const selectedBook = books.find((b) => b.id === selectedBookId)

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader activeBookId={selectedBookId} onBookChange={(bookId) => setSelectedBookId(bookId)} />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background p-4 md:p-6 pb-20 md:pb-6">
            <div className="mx-auto max-w-4xl space-y-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Export detailed reports of your financial data
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generate Report
                  </CardTitle>
                  <CardDescription>Select a book and report type to export as PDF</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="book">Select Book</Label>
                    <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                      <SelectTrigger id="book">
                        <SelectValue placeholder="Select a book" />
                      </SelectTrigger>
                      <SelectContent>
                        {books.map((book) => (
                          <SelectItem key={book.id} value={book.id}>
                            {book.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                      <SelectTrigger id="reportType">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Entries</SelectItem>
                        <SelectItem value="day-wise">Day-wise Summary</SelectItem>
                        <SelectItem value="category-wise">Category-wise Summary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedBook && (
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <h3 className="font-medium">Preview Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Book:</span>
                          <p className="font-medium">{selectedBook.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Entries:</span>
                          <p className="font-medium">{entries.length}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Report Type:</span>
                          <p className="font-medium">
                            {reportType === "all"
                              ? "All Entries"
                              : reportType === "day-wise"
                                ? "Day-wise Summary"
                                : "Category-wise Summary"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Categories:</span>
                          <p className="font-medium">{categories.length}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={generatePDF} disabled={!selectedBookId || generating} className="w-full" size="lg">
                    <Download className="mr-2 h-4 w-4" />
                    {generating ? "Generating..." : "Generate PDF Report"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Report Types Explained</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">All Entries</h4>
                    <p className="text-sm text-muted-foreground">
                      Complete list of all transactions with date, description, category, payment mode, and running
                      balance.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Day-wise Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      Transactions grouped by date with daily income, expense, and net totals for each day.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Category-wise Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      Transactions organized by category showing income and expense breakdown for each category.
                    </p>
                  </div>
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

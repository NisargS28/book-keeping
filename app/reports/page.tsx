"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getCurrentUser } from "@/lib/auth"
import { getBooks, getEntries, getCategories } from "@/lib/store"
import { Book, Entry, Category } from "@/lib/types"
import { Download, FileText, ArrowLeft } from "lucide-react"
import { format } from "date-fns"

type ReportType = "all" | "day-wise" | "category-wise"
type DatePeriod = "all" | "custom"

function dateFromCalendarString(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function getEntryCalendarDate(entry: Entry) {
  const value = entry.occurredAt || entry.date

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return dateFromCalendarString(value)
  }

  return new Date(value)
}

function ReportsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookIdParam = searchParams.get("bookId")

  const [loading, setLoading] = useState(true)
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string>("")
  const [reportType, setReportType] = useState<ReportType>("all")
  const [datePeriod, setDatePeriod] = useState<DatePeriod>("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [generating, setGenerating] = useState(false)
  const [dataLoading, setDataLoading] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [userId, setUserId] = useState<string>("")

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

      setUserId(user.id)
      setBooks(userBooks)
      
      // If bookIdParam is valid in user's books, select it, otherwise select the first book
      if (bookIdParam && userBooks.some((b) => b.id === bookIdParam)) {
        setSelectedBookId(bookIdParam)
      } else {
        setSelectedBookId(userBooks[0].id)
      }
      
      setLoading(false)
    }
    init()
  }, [router, bookIdParam])

  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      if (selectedBookId && userId) {
        setDataLoading(true)
        setEntries([])
        setCategories([])

        try {
          const [bookEntries, bookCategories] = await Promise.all([
            getEntries(selectedBookId, userId),
            getCategories(selectedBookId, userId),
          ])

          if (!cancelled) {
            setEntries(bookEntries)
            setCategories(bookCategories)
          }
        } finally {
          if (!cancelled) setDataLoading(false)
        }
      } else {
        setEntries([])
        setCategories([])
        setDataLoading(false)
      }
    }

    loadData()
    return () => {
      cancelled = true
    }
  }, [selectedBookId, userId])

  const isCustomRange = datePeriod === "custom"
  const isRangeComplete = Boolean(fromDate && toDate)
  const isRangePartiallyComplete = isCustomRange && Boolean(fromDate) !== Boolean(toDate)
  const isDateRangeInvalid = isCustomRange && isRangeComplete && fromDate > toDate
  const isDateRangeReady = !isCustomRange || (isRangeComplete && !isDateRangeInvalid)
  const filteredEntries = isDateRangeReady
    ? entries.filter((entry) => {
        if (!isCustomRange) return true
        return format(getEntryCalendarDate(entry), "yyyy-MM-dd") >= fromDate
          && format(getEntryCalendarDate(entry), "yyyy-MM-dd") <= toDate
      })
    : []
  const selectedPeriodLabel = !isCustomRange
    ? "All time"
    : isRangeComplete
      ? `${format(dateFromCalendarString(fromDate), "MMM dd, yyyy")} – ${format(dateFromCalendarString(toDate), "MMM dd, yyyy")}`
      : "Select a date range"
  const canGenerate = Boolean(selectedBookId) && !generating && !dataLoading && isDateRangeReady && filteredEntries.length > 0

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
            <p>Period: ${selectedPeriodLabel}</p>
          </div>
      `

      const totalIncome = filteredEntries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
      const totalExpense = filteredEntries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)
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
        filteredEntries.forEach((entry) => {
          const category = categories.find((c) => c.id === entry.categoryId)
          const entryDate = getEntryCalendarDate(entry)
          content += `
              <tr>
                <td>${format(entryDate, "MMM dd, yyyy HH:mm")}</td>
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
        const entriesByDate = filteredEntries.reduce((acc, entry) => {
          const entryDate = getEntryCalendarDate(entry)
          const dateKey = format(entryDate, "yyyy-MM-dd")
          if (!acc[dateKey]) acc[dateKey] = []
          acc[dateKey].push(entry)
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
          .forEach((dateKey) => {
            const dayEntries = entriesByDate[dateKey]
            const dayIncome = dayEntries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
            const dayExpense = dayEntries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)

            const [y, m, d] = dateKey.split("-").map(Number)
            const dateObj = new Date(y, m - 1, d)

            content += `
              <tr class="group-header">
                <td colspan="5">
                  ${format(dateObj, "MMMM dd, yyyy")} - 
                  Income: ₹${dayIncome.toFixed(2)} | 
                  Expense: ₹${dayExpense.toFixed(2)} | 
                  Net: ₹${(dayIncome - dayExpense).toFixed(2)}
                </td>
              </tr>
            `

            dayEntries.forEach((entry) => {
              const category = categories.find((c) => c.id === entry.categoryId)
              const entryDate = getEntryCalendarDate(entry)
              content += `
                <tr>
                  <td>${format(entryDate, "HH:mm")}</td>
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
          const categoryEntries = filteredEntries.filter((e) => e.categoryId === category.id)
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
            const entryDate = getEntryCalendarDate(entry)
            content += `
              <tr>
                <td>${format(entryDate, "MMM dd, yyyy HH:mm")}</td>
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const selectedBook = books.find((b) => b.id === selectedBookId)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader activeBookId={selectedBookId} />
      <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (selectedBookId) {
                  router.push(`/ledger/${selectedBookId}`)
                } else {
                  router.push("/books")
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reports</h1>
              <p className="text-sm text-muted-foreground">
                Export detailed reports for your books
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Generate Report
              </CardTitle>
              <CardDescription>Select a book and report format to preview and download</CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor="datePeriod">Date Period</Label>
                <Select value={datePeriod} onValueChange={(value) => setDatePeriod(value as DatePeriod)}>
                  <SelectTrigger id="datePeriod">
                    <SelectValue placeholder="Select a date period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isCustomRange && (
                <div className="space-y-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fromDate">From</Label>
                      <Input
                        id="fromDate"
                        type="date"
                        value={fromDate}
                        onChange={(event) => setFromDate(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toDate">To</Label>
                      <Input
                        id="toDate"
                        type="date"
                        value={toDate}
                        onChange={(event) => setToDate(event.target.value)}
                      />
                    </div>
                  </div>
                  {isDateRangeInvalid && (
                    <p className="text-sm text-destructive">The From date must be on or before the To date.</p>
                  )}
                  {isRangePartiallyComplete && (
                    <p className="text-sm text-destructive">Select both From and To dates to generate a report.</p>
                  )}
                </div>
              )}

              {selectedBook && (
                <div className="rounded-xl border border-border/80 bg-muted/50 p-4 space-y-2">
                  <h3 className="font-semibold text-sm">Preview Information</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Book</span>
                      <p className="font-semibold text-foreground">{selectedBook.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Total Entries</span>
                      <p className="font-semibold text-foreground">{filteredEntries.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Report Type</span>
                      <p className="font-semibold text-foreground">
                        {reportType === "all"
                          ? "All Entries"
                          : reportType === "day-wise"
                            ? "Day-wise"
                            : "Category-wise"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Categories</span>
                      <p className="font-semibold text-foreground">{categories.length}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-4">
                      <span className="text-muted-foreground block mb-0.5">Period</span>
                      <p className="font-semibold text-foreground">{selectedPeriodLabel}</p>
                    </div>
                  </div>
                </div>
              )}

              {isDateRangeReady && !dataLoading && filteredEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {isCustomRange ? "No entries in this date range." : "No entries in this book."}
                </p>
              )}

              <Button
                onClick={generatePDF}
                disabled={!canGenerate}
                className="w-full h-11 gap-2 font-semibold"
                size="lg"
              >
                <Download className="h-4 w-4" />
                {generating ? "Generating..." : "Download / Print Report"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading reports...</div>}>
        <ReportsContent />
      </Suspense>
    </AuthGuard>
  )
}

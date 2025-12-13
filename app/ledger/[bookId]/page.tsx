"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getBook, getEntries, getCategories, type Entry, type Category } from "@/lib/store"
import { ArrowLeft, Plus, Minus, FileText, Search, Edit2 } from "lucide-react"
import { format } from "date-fns"
import { EntryDialog } from "@/components/entry-dialog"

export default function LedgerPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params)
  const router = useRouter()
  const [book, setBook] = useState<any>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null)
  const [dialogType, setDialogType] = useState<"income" | "expense">("income")

  const loadData = () => {
    const bookData = getBook(bookId)
    if (!bookData) {
      router.push("/books")
      return
    }

    setBook(bookData)
    const bookEntries = getEntries(bookId)
    const bookCategories = getCategories(bookId)
    setEntries(bookEntries)
    setFilteredEntries(bookEntries)
    setCategories(bookCategories)
  }

  useEffect(() => {
    loadData()
  }, [bookId])

  useEffect(() => {
    let filtered = entries

    if (typeFilter !== "all") {
      filtered = filtered.filter((e) => e.type === typeFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((e) => e.categoryId === categoryFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(query) ||
          e.amount.toString().includes(query) ||
          e.notes?.toLowerCase().includes(query),
      )
    }

    setFilteredEntries(filtered)
  }, [entries, typeFilter, categoryFilter, searchQuery])

  const totalIncome = entries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)

  const totalExpense = entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Uncategorized"
  }

  const handleAddCashIn = () => {
    setDialogType("income")
    setEntryToEdit(null)
    setEntryDialogOpen(true)
  }

  const handleAddCashOut = () => {
    setDialogType("expense")
    setEntryToEdit(null)
    setEntryDialogOpen(true)
  }

  const handleEdit = (entry: Entry) => {
    setDialogType(entry.type)
    setEntryToEdit(entry)
    setEntryDialogOpen(true)
  }

  if (!book) {
    return null
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/books")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{book.name}</h1>
                {book.description && <p className="text-sm text-muted-foreground">{book.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleAddCashIn} className="gap-2 bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4" />
                Cash In
              </Button>
              <Button onClick={handleAddCashOut} variant="destructive" className="gap-2">
                <Minus className="h-4 w-4" />
                Cash Out
              </Button>
              <Button
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() => router.push(`/reports/${bookId}`)}
              >
                <FileText className="h-4 w-4" />
                Reports
              </Button>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto max-w-7xl space-y-6">
            {/* Summary Bar */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Cash In</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Cash Out</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${book.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(book.balance)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Search */}
            <Card>
              <CardHeader>
                <CardTitle>Filters & Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by remark or amount..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="income">Cash In</SelectItem>
                      <SelectItem value="expense">Cash Out</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("")
                      setTypeFilter("all")
                      setCategoryFilter("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Ledger Entries ({filteredEntries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredEntries.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No entries found. Add your first transaction to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Remarks</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Payment Mode</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Running Balance</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(entry.date), "MMM dd, yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{entry.description}</div>
                                {entry.notes && <div className="text-sm text-muted-foreground">{entry.notes}</div>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="rounded-full bg-muted px-2 py-1 text-xs">
                                {getCategoryName(entry.categoryId)}
                              </span>
                            </TableCell>
                            <TableCell>{entry.paymentMode}</TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                entry.type === "income" ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {entry.type === "income" ? "+" : "-"}
                              {formatCurrency(entry.amount)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(entry.runningBalance)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <EntryDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        bookId={bookId}
        type={dialogType}
        entry={entryToEdit}
        onSuccess={loadData}
      />
    </AuthGuard>
  )
}

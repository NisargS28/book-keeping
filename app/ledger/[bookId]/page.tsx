"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { getBook, getEntries, getCategories, type Entry, type Category } from "@/lib/store"
import { ArrowLeft, Plus, Minus, Search, Edit2, Filter } from "lucide-react"
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const loadData = async () => {
    const bookData = await getBook(bookId)
    if (!bookData) {
      router.push("/books")
      return
    }

    setBook(bookData)
    const bookEntries = await getEntries(bookId)
    const bookCategories = await getCategories(bookId)
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
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
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
        <div className="sticky top-0 z-10 border-b bg-card">
          <div className="container flex h-auto min-h-16 flex-col gap-3 px-4 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:px-6 md:py-0">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/books")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg md:text-xl font-semibold">{book.name}</h1>
                {book.description && <p className="text-xs md:text-sm text-muted-foreground">{book.description}</p>}
              </div>
            </div>
            {/* Desktop buttons */}
            <div className="hidden md:flex items-center gap-2">
              <Button onClick={handleAddCashIn} className="gap-2 bg-green-600 hover:bg-green-700 text-sm">
                <Plus className="h-4 w-4" />
                Cash In
              </Button>
              <Button onClick={handleAddCashOut} variant="destructive" className="gap-2 text-sm">
                <Minus className="h-4 w-4" />
                Cash Out
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile sticky buttons at bottom */}
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-50 border-t bg-card p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Button onClick={handleAddCashIn} className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Cash In
            </Button>
            <Button onClick={handleAddCashOut} variant="destructive" className="flex-1 gap-2">
              <Minus className="h-4 w-4" />
              Cash Out
            </Button>
          </div>
        </div>

        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-32 md:pb-20">
          <div className="container mx-auto max-w-7xl space-y-6">
            {/* Summary Bar - Desktop */}
            <div className="hidden md:grid gap-4 md:grid-cols-3">
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

            {/* Summary Bar - Mobile Compact */}
            <Card className="md:hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="text-xs text-muted-foreground mb-1">In (+)</div>
                    <div className="text-base font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="flex-1 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Out (-)</div>
                    <div className="text-base font-bold text-red-600">{formatCurrency(totalExpense)}</div>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="flex-1 text-center">
                    <div className="text-xs text-muted-foreground mb-1">Net</div>
                    <div className={`text-base font-bold ${book.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(book.balance)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters & Search - Desktop */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Filters & Search</CardTitle>
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

            {/* Filters & Search - Mobile Compact */}
            <div className="md:hidden flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Type</label>
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
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
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
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSearchQuery("")
                          setTypeFilter("all")
                          setCategoryFilter("all")
                          setFilterSheetOpen(false)
                        }}
                      >
                        Clear All
                      </Button>
                      <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Ledger Entries ({filteredEntries.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                {filteredEntries.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No entries found. Add your first transaction to get started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Date & Time</TableHead>
                          <TableHead className="whitespace-nowrap">Remarks</TableHead>
                          <TableHead className="whitespace-nowrap">Category</TableHead>
                          <TableHead className="whitespace-nowrap">Payment Mode</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Running Balance</TableHead>
                          <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
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
      </div>

      <EntryDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        bookId={bookId}
        categories={categories}
        onEntryCreated={loadData}
        entry={entryToEdit}
      />
    </AuthGuard>
  )
}

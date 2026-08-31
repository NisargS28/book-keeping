"use client"

import { use, useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getBook, getBooks, getEntries, getCategories, createCategory, createEntry, setActiveBookId, deleteEntry, type Book, type Entry, type Category } from "@/lib/store"
import {
  ArrowLeft,
  Plus,
  Minus,
  Search,
  Edit2,
  Filter,
  Clock,
  User,
  ChevronRight,
  Calendar,
  X,
  FileText,
  ShieldCheck,
  EllipsisVertical,
  ArrowRightLeft,
  Copy,
  Repeat2,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { EntryDialog } from "@/components/entry-dialog"
import { EntryDetailSheet } from "@/components/entry-detail-sheet"

type EntryAction = "move" | "copy" | "opposite"

function LedgerContent({ bookId }: { bookId: string }) {
  const router = useRouter()
  const [book, setBook] = useState<any>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<Entry | null>(null)
  const [dialogType, setDialogType] = useState<"income" | "expense">("income")
  
  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<Entry | null>(null)
  
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [availableBooks, setAvailableBooks] = useState<Book[]>([])
  const [actionEntry, setActionEntry] = useState<Entry | null>(null)
  const [pendingAction, setPendingAction] = useState<EntryAction | null>(null)
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false)
  const [targetBookDialogOpen, setTargetBookDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [actionProcessing, setActionProcessing] = useState(false)

  const loadData = async () => {
    const { getCurrentUser } = await import("@/lib/auth")
    const user = await getCurrentUser()
    if (!user) { router.push("/login"); return }
    setCurrentUserId(user.id)
    setActiveBookId(bookId)
    const bookData = await getBook(bookId, user.id)
    if (!bookData) {
      router.push("/books")
      return
    }

    setBook(bookData)
    const [bookEntries, bookCategories, userBooks] = await Promise.all([
      getEntries(bookId, user.id),
      getCategories(bookId, user.id),
      getBooks(user.id),
    ])
    setEntries(bookEntries)
    setFilteredEntries(bookEntries)
    setCategories(bookCategories)
    setAvailableBooks(userBooks)
  }

  useEffect(() => {
    loadData()
  }, [bookId])

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Uncategorized"
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.color || "#8b5cf6"
  }

  // Filter application
  useEffect(() => {
    let filtered = entries

    if (typeFilter !== "all") {
      filtered = filtered.filter((e) => e.type === typeFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((e) => e.categoryId === categoryFilter)
    }

    if (startDate) {
      filtered = filtered.filter((e) => {
        const entryDateStr = format(new Date(e.occurredAt || e.date), "yyyy-MM-dd")
        return entryDateStr >= startDate
      })
    }

    if (endDate) {
      filtered = filtered.filter((e) => {
        const entryDateStr = format(new Date(e.occurredAt || e.date), "yyyy-MM-dd")
        return entryDateStr <= endDate
      })
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(query) ||
          e.amount.toString().includes(query) ||
          (e.people && e.people.toLowerCase().includes(query)) ||
          (e.paymentMode && e.paymentMode.toLowerCase().includes(query)) ||
          (e.notes && e.notes.toLowerCase().includes(query)) ||
          getCategoryName(e.categoryId).toLowerCase().includes(query)
      )
    }

    setFilteredEntries(filtered)
  }, [entries, typeFilter, categoryFilter, searchQuery, startDate, endDate, categories])

  const isFiltered =
    searchQuery.trim() !== "" ||
    typeFilter !== "all" ||
    categoryFilter !== "all" ||
    startDate !== "" ||
    endDate !== ""

  const activeFiltersCount =
    (searchQuery.trim() ? 1 : 0) +
    (typeFilter !== "all" ? 1 : 0) +
    (categoryFilter !== "all" ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0)

  const clearAllFilters = () => {
    setSearchQuery("")
    setTypeFilter("all")
    setCategoryFilter("all")
    setStartDate("")
    setEndDate("")
  }

  const totalIncome = filteredEntries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0)
  const totalExpense = filteredEntries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
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

  const handleViewDetail = (entry: Entry) => {
    setSelectedEntryForDetail(entry)
    setDetailSheetOpen(true)
  }

  const handleDeleteEntryFromSheet = async (entry: Entry) => {
    await deleteEntry(entry.id)
    await loadData()
  }

  const handleOpenActions = (entry: Entry) => {
    setActionEntry(entry)
    setActionsSheetOpen(true)
  }

  const handleActionSelect = (entry: Entry, action: EntryAction | "delete") => {
    setActionEntry(entry)
    setActionsSheetOpen(false)

    if (action === "delete") {
      setDeleteDialogOpen(true)
      return
    }

    setPendingAction(action)
    setTargetBookDialogOpen(true)
  }

  const handleTargetBookSelect = async (targetBook: Book) => {
    if (!actionEntry || !pendingAction || !currentUserId) return

    const sourceCategory = categories.find((category) => category.id === actionEntry.categoryId)
    if (!sourceCategory) {
      alert("The category for this entry could not be found.")
      return
    }

    try {
      setActionProcessing(true)
      const targetCategories = await getCategories(targetBook.id, currentUserId)
      let targetCategory = targetCategories.find((category) => category.name === sourceCategory.name)

      if (!targetCategory) {
        targetCategory = await createCategory({
          bookId: targetBook.id,
          name: sourceCategory.name,
          color: sourceCategory.color || "#8b5cf6",
        }, currentUserId)
      }

      await createEntry({
        bookId: targetBook.id,
        userId: currentUserId,
        categoryId: targetCategory.id,
        description: actionEntry.description,
        people: actionEntry.people,
        amount: actionEntry.amount,
        type: pendingAction === "opposite"
          ? actionEntry.type === "income" ? "expense" : "income"
          : actionEntry.type,
        paymentMode: actionEntry.paymentMode,
        date: actionEntry.date,
        occurredAt: actionEntry.occurredAt,
        notes: actionEntry.notes,
      })

      if (pendingAction === "move") {
        await deleteEntry(actionEntry.id)
      }

      setTargetBookDialogOpen(false)
      setActionEntry(null)
      setPendingAction(null)
      await loadData()
    } catch (error) {
      console.error("Failed to process entry action:", error)
      alert("Unable to complete this action. Please try again.")
    } finally {
      setActionProcessing(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!actionEntry) return

    try {
      setActionProcessing(true)
      await handleDeleteEntryFromSheet(actionEntry)
      setDeleteDialogOpen(false)
      setDetailSheetOpen(false)
      setActionEntry(null)
    } catch (error) {
      console.error("Failed to delete entry:", error)
      alert("Unable to delete this entry. Please try again.")
    } finally {
      setActionProcessing(false)
    }
  }

  const handleOpenReports = () => {
    router.push(`/reports?bookId=${bookId}`)
  }

  // Date grouped entries for mobile layout (descending)
  const groupedEntries = useMemo(() => {
    const map = new Map<string, Entry[]>()

    filteredEntries.forEach((entry) => {
      const d = new Date(entry.occurredAt || entry.date)
      const dateKey = format(d, "yyyy-MM-dd")
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(entry)
    })

    const todayStr = format(new Date(), "yyyy-MM-dd")
    const yesterdayDate = new Date()
    yesterdayDate.setDate(yesterdayDate.getDate() - 1)
    const yesterdayStr = format(yesterdayDate, "yyyy-MM-dd")

    // Sort date keys descending (newest dates first)
    const sortedKeys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1))

    return sortedKeys.map((dateKey) => {
      const dayEntries = map.get(dateKey)!
      // Sort entries within day descending by time
      dayEntries.sort(
        (a, b) =>
          new Date(b.occurredAt || b.date).getTime() -
          new Date(a.occurredAt || a.date).getTime()
      )

      const [y, m, d] = dateKey.split("-").map(Number)
      const dateObj = new Date(y, m - 1, d)

      let dateLabel = format(dateObj, "EEE, MMM dd, yyyy")
      if (dateKey === todayStr) {
        dateLabel = `Today • ${format(dateObj, "MMM dd")}`
      } else if (dateKey === yesterdayStr) {
        dateLabel = `Yesterday • ${format(dateObj, "MMM dd")}`
      }

      const dayIncome = dayEntries
        .filter((e) => e.type === "income")
        .reduce((s, e) => s + e.amount, 0)
      const dayExpense = dayEntries
        .filter((e) => e.type === "expense")
        .reduce((s, e) => s + e.amount, 0)
      const net = dayIncome - dayExpense

      return {
        dateKey,
        dateLabel,
        subLabel: format(dateObj, "EEEE"),
        dayIncome,
        dayExpense,
        net,
        entries: dayEntries,
      }
    })
  }, [filteredEntries])

  if (!book) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm font-medium">Loading ledger...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
        {/* Top Header */}
        <div className="sticky top-0 z-30 border-b border-border/80 bg-card/90 backdrop-blur-xl">
          <div className="container flex h-auto min-h-16 flex-col gap-3 px-4 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:px-7 md:py-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.push("/books")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">Ledger</p>
                  <h1 className="text-lg font-bold tracking-tight md:text-xl">{book.name}</h1>
                  {book.description && <p className="text-xs md:text-sm text-muted-foreground">{book.description}</p>}
                </div>
              </div>

              {/* Mobile Reports Button in Header */}
              <div className="flex items-center gap-2 md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenReports}
                  className="gap-1.5 text-xs h-8 border-border/80"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Reports
                </Button>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={handleOpenReports}
                className="gap-2 text-sm border-border/80"
              >
                <FileText className="h-4 w-4 text-primary" />
                Reports
              </Button>
              <Button onClick={handleAddCashIn} className="gap-2 bg-success hover:bg-success/90 text-sm">
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
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-xl md:hidden">
          <div className="flex items-center gap-2">
            <Button onClick={handleAddCashIn} className="flex-1 gap-2 bg-success hover:bg-success/90 font-semibold h-11">
              <Plus className="h-4 w-4" />
              Cash In
            </Button>
            <Button onClick={handleAddCashOut} variant="destructive" className="flex-1 gap-2 font-semibold h-11">
              <Minus className="h-4 w-4" />
              Cash Out
            </Button>
          </div>
        </div>

        <main className="flex-1 overflow-auto p-4 pb-28 md:p-7 md:pb-8">
          <div className="container mx-auto max-w-7xl space-y-5 md:space-y-7">
            {/* Summary Bar - Desktop */}
            <div className="hidden md:grid gap-4 md:grid-cols-3">
              <Card className="border-success/15 bg-gradient-to-br from-card to-success/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Cash In</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight text-success">{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>
              <Card className="border-destructive/15 bg-gradient-to-br from-card to-destructive/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Cash Out</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight text-destructive">{formatCurrency(totalExpense)}</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-card to-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold tracking-tight ${book.balance >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(book.balance)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Bar - Mobile Compact */}
            <Card className="md:hidden border-border/80 shadow-xs">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <div className="text-[11px] font-medium text-muted-foreground mb-0.5">Total In (+)</div>
                    <div className="text-sm font-bold text-success">{formatCurrency(totalIncome)}</div>
                  </div>
                  <div className="h-9 w-px bg-border/80" />
                  <div className="flex-1 text-center">
                    <div className="text-[11px] font-medium text-muted-foreground mb-0.5">Total Out (-)</div>
                    <div className="text-sm font-bold text-destructive">{formatCurrency(totalExpense)}</div>
                  </div>
                  <div className="h-9 w-px bg-border/80" />
                  <div className="flex-1 text-center">
                    <div className="text-[11px] font-medium text-muted-foreground mb-0.5">Net Balance</div>
                    <div className={`text-sm font-bold ${book.balance >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(book.balance)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters & Search - Desktop */}
            <Card className="hidden md:block">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base md:text-lg">Filters & Search</CardTitle>
                  {isFiltered && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-5">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search remarks, people, amount..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Type Filter */}
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

                  {/* Category Filter */}
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date From */}
                  <div className="relative">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      title="Start Date"
                      className="text-xs"
                    />
                  </div>

                  {/* Date To */}
                  <div className="relative">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      title="End Date"
                      className="text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters & Search - Mobile Compact */}
            <div className="md:hidden flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant={isFiltered ? "default" : "outline"}
                    size="icon"
                    className="relative shrink-0"
                  >
                    <Filter className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-3xl border-t border-border/80 px-4 pb-8 pt-5">
                  <SheetHeader className="pb-3 border-b border-border/60">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-base font-bold">Filters</SheetTitle>
                      {isFiltered && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-7 text-xs text-muted-foreground"
                        >
                          Reset All
                        </Button>
                      )}
                    </div>
                  </SheetHeader>

                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Transaction Type
                      </label>
                      <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="income">Cash In</SelectItem>
                          <SelectItem value="expense">Cash Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        Category
                      </label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                          From Date
                        </label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                          To Date
                        </label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          clearAllFilters()
                          setFilterSheetOpen(false)
                        }}
                      >
                        Clear
                      </Button>
                      <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active Filter Badges on Mobile */}
            {isFiltered && (
              <div className="md:hidden flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground text-[11px]">Filtered:</span>
                {typeFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">
                    Type: {typeFilter === "income" ? "In" : "Out"}
                    <button onClick={() => setTypeFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {categoryFilter !== "all" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">
                    {getCategoryName(categoryFilter)}
                    <button onClick={() => setCategoryFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {(startDate || endDate) && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">
                    {startDate || "Start"} → {endDate || "End"}
                    <button onClick={() => { setStartDate(""); setEndDate("") }}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* MOBILE VIEW: Date-Grouped Transaction Cards */}
            <div className="md:hidden space-y-5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-foreground">
                  Ledger Entries <span className="text-muted-foreground font-normal">({filteredEntries.length})</span>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenReports}
                  className="gap-1 text-xs h-7 border-border/80"
                >
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Reports
                </Button>
              </div>

              {filteredEntries.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">No transactions found</p>
                    <p className="text-xs">
                      {isFiltered ? "Try changing your filters or search criteria." : "Add your first transaction using the buttons below."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                groupedEntries.map((group) => (
                  <section key={group.dateKey} className="space-y-2">
                    {/* Date Section Header */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                          {group.dateLabel}
                        </h3>
                      </div>
                      <div className="text-[11px] font-semibold text-muted-foreground">
                        {group.dayIncome > 0 && (
                          <span className="text-success mr-2">+{formatCurrency(group.dayIncome)}</span>
                        )}
                        {group.dayExpense > 0 && (
                          <span className="text-destructive">-{formatCurrency(group.dayExpense)}</span>
                        )}
                      </div>
                    </div>

                    {/* Cards under this date */}
                    <div className="space-y-2">
                      {group.entries.map((entry) => {
                        const isIncome = entry.type === "income"
                        const entryTime = format(new Date(entry.occurredAt || entry.date), "hh:mm a")

                        return (
                          <div
                            key={entry.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleViewDetail(entry)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                handleViewDetail(entry)
                              }
                            }}
                            className="group relative flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-3.5 shadow-xs transition-all hover:border-primary/40 active:scale-[0.99] cursor-pointer"
                          >
                            {/* Top Row: Time, Category chip, Payment Mode, People */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="flex items-center gap-1 font-medium text-muted-foreground text-[11px]">
                                  <Clock className="h-3 w-3" />
                                  {entryTime}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: getCategoryColor(entry.categoryId) }}
                                  />
                                  {getCategoryName(entry.categoryId)}
                                </span>
                                {entry.paymentMode && (
                                  <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                                    {entry.paymentMode}
                                  </span>
                                )}
                                {entry.people && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                    <User className="h-2.5 w-2.5" />
                                    {entry.people}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Middle Row: Description & Signed Amount */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                                  {entry.description}
                                </p>
                                {entry.notes && (
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                              <div
                                className={`text-base font-extrabold tracking-tight shrink-0 ${
                                  isIncome ? "text-success" : "text-destructive"
                                }`}
                              >
                                {isIncome ? "+" : "-"}
                                {formatCurrency(entry.amount)}
                              </div>
                            </div>

                            {/* Bottom Row: Running Balance & Tap Prompt */}
                            <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
                              <span className="font-medium">
                                Bal: <strong className="text-foreground/90">{formatCurrency(entry.runningBalance)}</strong>
                              </span>
                              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-muted-foreground group-hover:text-primary transition-colors">
                                Details
                                <ChevronRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            {/* DESKTOP VIEW: Full Table */}
            <Card className="hidden md:block">
              <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
                <CardTitle className="text-base md:text-lg">
                  Ledger Entries <span className="text-muted-foreground">({filteredEntries.length})</span>
                </CardTitle>
                {/* Reports button on top right of Ledger Entries tab/card */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenReports}
                  className="gap-2 text-xs border-border/80"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  View Reports
                </Button>
              </CardHeader>
              <CardContent className="p-0 md:p-6 md:pt-0">
                {filteredEntries.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    No entries found. Add your first transaction to get started.
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="whitespace-nowrap font-bold">Date & Time</TableHead>
                          <TableHead className="whitespace-nowrap font-bold">Remarks</TableHead>
                          <TableHead className="whitespace-nowrap font-bold">People</TableHead>
                          <TableHead className="whitespace-nowrap font-bold">Category</TableHead>
                          <TableHead className="whitespace-nowrap font-bold">Payment Mode</TableHead>
                          <TableHead className="text-right whitespace-nowrap font-bold">Amount</TableHead>
                          <TableHead className="text-right whitespace-nowrap font-bold">Running Balance</TableHead>
                          <TableHead className="text-right whitespace-nowrap font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry) => {
                          const isIncome = entry.type === "income"
                          const entryDate = new Date(entry.occurredAt || entry.date)

                          return (
                            <TableRow
                              key={entry.id}
                              className="group transition-colors hover:bg-muted/50 cursor-pointer"
                              onClick={() => handleViewDetail(entry)}
                            >
                              <TableCell className="whitespace-nowrap font-medium text-xs">
                                {format(entryDate, "MMM dd, yyyy HH:mm")}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-semibold text-foreground">{entry.description}</div>
                                  {entry.notes && <div className="text-xs text-muted-foreground">{entry.notes}</div>}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                                {entry.people || "—"}
                              </TableCell>
                              <TableCell>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: getCategoryColor(entry.categoryId) }}
                                  />
                                  {getCategoryName(entry.categoryId)}
                                </span>
                              </TableCell>
                              <TableCell className="capitalize text-xs">{entry.paymentMode || "—"}</TableCell>
                              <TableCell
                                className={`text-right font-bold ${
                                  isIncome ? "text-success" : "text-destructive"
                                }`}
                              >
                                {isIncome ? "+" : "-"}
                                {formatCurrency(entry.amount)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-foreground">
                                {formatCurrency(entry.runningBalance)}
                              </TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-end gap-1">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" title="Entry actions">
                                        <EllipsisVertical className="h-4 w-4" />
                                        <span className="sr-only">Entry actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuItem onClick={() => handleActionSelect(entry, "move")}>
                                        <ArrowRightLeft />
                                        Move Entry
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleActionSelect(entry, "copy")}>
                                        <Copy />
                                        Copy Entry
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleActionSelect(entry, "opposite")}>
                                        <Repeat2 />
                                        Copy Opposite Entry
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem variant="destructive" onClick={() => handleActionSelect(entry, "delete")}>
                                        <Trash2 />
                                        Delete Entry
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Edit entry"
                                    onClick={() => handleEdit(entry)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* End-to-End Encryption Notice */}
            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/40 py-3.5 px-4 text-xs text-muted-foreground text-center shadow-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                All ledger transactions in this book are <strong className="text-foreground">End-to-End Encrypted (AES-256-GCM)</strong> in your browser before saving.
              </span>
            </div>
          </div>
        </main>

      <Sheet open={actionsSheetOpen} onOpenChange={setActionsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t border-border/80 px-5 pb-8 pt-5 sm:max-w-lg sm:mx-auto">
          <SheetHeader className="border-b border-border/60 pb-4 text-left">
            <SheetTitle>Actions</SheetTitle>
          </SheetHeader>
          <div className="space-y-1 pt-3">
            <Button variant="ghost" className="h-auto w-full justify-start gap-4 px-3 py-3 text-left" onClick={() => actionEntry && handleActionSelect(actionEntry, "move")}>
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              <span><span className="block font-semibold">Move Entry</span><span className="block pt-0.5 text-xs font-normal text-muted-foreground">Move this entry to another book.</span></span>
            </Button>
            <Button variant="ghost" className="h-auto w-full justify-start gap-4 px-3 py-3 text-left" onClick={() => actionEntry && handleActionSelect(actionEntry, "copy")}>
              <Copy className="h-5 w-5 text-primary" />
              <span><span className="block font-semibold">Copy Entry</span><span className="block pt-0.5 text-xs font-normal text-muted-foreground">Keep this entry in both books.</span></span>
            </Button>
            <Button variant="ghost" className="h-auto w-full justify-start gap-4 px-3 py-3 text-left" onClick={() => actionEntry && handleActionSelect(actionEntry, "opposite")}>
              <Repeat2 className="h-5 w-5 text-primary" />
              <span><span className="block font-semibold">Copy Opposite Entry</span><span className="block pt-0.5 text-xs font-normal text-muted-foreground">Copy it with Cash In and Cash Out reversed.</span></span>
            </Button>
            <div className="my-2 border-t border-border/60" />
            <Button variant="ghost" className="h-auto w-full justify-start gap-4 px-3 py-3 text-left text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => actionEntry && handleActionSelect(actionEntry, "delete")}>
              <Trash2 className="h-5 w-5" />
              <span><span className="block font-semibold">Delete Entry</span><span className="block pt-0.5 text-xs font-normal text-destructive/80">Permanently delete this entry.</span></span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={targetBookDialogOpen} onOpenChange={setTargetBookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select destination book</DialogTitle>
            <DialogDescription>
              Choose where to {pendingAction === "move" ? "move" : "copy"} this entry.
            </DialogDescription>
          </DialogHeader>
          {availableBooks.filter((candidate) => candidate.id !== bookId).length === 0 ? (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              Create another book before moving or copying an entry.
            </p>
          ) : (
            <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {availableBooks.filter((candidate) => candidate.id !== bookId).map((candidate) => (
                <Button
                  key={candidate.id}
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-between gap-4 px-4 py-3 text-left"
                  onClick={() => handleTargetBookSelect(candidate)}
                  disabled={actionProcessing}
                >
                  <span className="min-w-0"><span className="block truncate font-semibold">{candidate.name}</span>{candidate.description && <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">{candidate.description}</span>}</span>
                  <span className={`shrink-0 text-sm font-bold ${candidate.balance >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(candidate.balance)}</span>
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the entry and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={actionProcessing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {actionProcessing ? "Deleting..." : "Delete Entry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Entry Create / Edit Dialog */}
      <EntryDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        bookId={bookId}
        userId={currentUserId}
        categories={categories}
        onEntryCreated={loadData}
        entry={entryToEdit}
        initialType={dialogType}
      />

      {/* Read-Only Entry Details Bottom Sheet */}
      <EntryDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        entry={selectedEntryForDetail}
        categories={categories}
        onEdit={handleEdit}
        onMoreActions={handleOpenActions}
      />
    </div>
  )
}

export default function LedgerPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params)

  return (
    <AuthGuard>
      <LedgerContent bookId={bookId} />
    </AuthGuard>
  )
}

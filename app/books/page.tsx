"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { EntryDialog } from "@/components/entry-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getCurrentUser } from "@/lib/auth"
import { getBooks, getCategories, createBook, createCategory, createEntry, deleteBook, updateBook, setActiveBookId, type Book, type Category } from "@/lib/store"
import { ArrowUpRight, Plus, Minus, Trash2, BookOpen, Edit2, WalletCards, LayoutDashboard } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

function BooksContent() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookToDelete, setBookToDelete] = useState<string | null>(null)
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null)
  const [newBookName, setNewBookName] = useState("")
  const [newBookDescription, setNewBookDescription] = useState("")
  const [initialAmount, setInitialAmount] = useState("")
  const [editBookName, setEditBookName] = useState("")
  const [editBookDescription, setEditBookDescription] = useState("")
  const [bookPickerOpen, setBookPickerOpen] = useState(false)
  const [entryDialogOpen, setEntryDialogOpen] = useState(false)
  const [selectedEntryBook, setSelectedEntryBook] = useState<Book | null>(null)
  const [selectedBookCategories, setSelectedBookCategories] = useState<Category[]>([])
  const [entryType, setEntryType] = useState<"income" | "expense">("income")
  const [selectingBook, setSelectingBook] = useState(false)
  const [currentUserId, setCurrentUserId] = useState("")
  const [loading, setLoading] = useState(true)

  const loadBooks = async () => {
    const user = await getCurrentUser()
    if (!user) return

    setCurrentUserId(user.id)
    const userBooks = await getBooks(user.id)
    setBooks(userBooks)
    setLoading(false)
  }

  useEffect(() => {
    loadBooks()
  }, [])

  const handleCreateBook = async () => {
    const user = await getCurrentUser()
    if (!user || !newBookName.trim()) return

    const book = await createBook(user.id, newBookName, "INR", newBookDescription)
    const openingBalance = Number.parseFloat(initialAmount)

    if (Number.isFinite(openingBalance) && openingBalance > 0) {
      const openingCategory = await createCategory({
        bookId: book.id,
        name: "Opening Balance",
        color: "#16a34a",
      }, user.id)

      const now = new Date()
      await createEntry({
        bookId: book.id,
        userId: user.id,
        categoryId: openingCategory.id,
        description: "Opening balance",
        amount: openingBalance,
        type: "income",
        paymentMode: "cash",
        date: now.toISOString().slice(0, 10),
        occurredAt: now.toISOString(),
      })
    }

    setNewBookName("")
    setNewBookDescription("")
    setInitialAmount("")
    setDialogOpen(false)
    loadBooks()
  }

  const handleOpenBook = (bookId: string) => {
    setActiveBookId(bookId)
    router.push(`/ledger/${bookId}`)
  }

  const handleCashAction = (type: "income" | "expense") => {
    setEntryType(type)

    if (books.length === 0) {
      setDialogOpen(true)
      return
    }

    setBookPickerOpen(true)
  }

  const handleSelectEntryBook = async (book: Book) => {
    const user = await getCurrentUser()
    if (!user) return

    try {
      setSelectingBook(true)
      const categories = await getCategories(book.id, user.id)
      setCurrentUserId(user.id)
      setSelectedEntryBook(book)
      setSelectedBookCategories(categories)
      setBookPickerOpen(false)
      setEntryDialogOpen(true)
    } finally {
      setSelectingBook(false)
    }
  }

  const handleEditBook = async () => {
    if (!bookToEdit || !editBookName.trim()) return
    const user = await getCurrentUser()
    if (!user) return

    await updateBook(bookToEdit.id, user.id, {
      name: editBookName,
      description: editBookDescription,
    })

    setEditDialogOpen(false)
    setBookToEdit(null)
    setEditBookName("")
    setEditBookDescription("")
    loadBooks()
  }

  const handleDeleteBook = async () => {
    if (!bookToDelete) return
    await deleteBook(bookToDelete)
    setDeleteDialogOpen(false)
    setBookToDelete(null)
    loadBooks()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading books...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader activeBookId={null} />
        <main className="flex-1 overflow-auto p-4 pb-28 md:p-7 md:pb-28">
          <div className="mx-auto max-w-6xl space-y-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">Your workspace</p>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">My books</h1>
                <p className="mt-2 text-sm md:text-base text-muted-foreground">Keep separate ledgers for everything that matters.</p>
              </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="outline"
                className="h-11 gap-2 border-border/80 hover:bg-muted font-semibold shadow-sm"
                onClick={() => router.push("/dashboard")}
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Analytics Dashboard
              </Button>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 w-full gap-2 sm:w-auto font-semibold shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add New Book
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Book</DialogTitle>
                    <DialogDescription>Create a new book to track separate finances</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Book Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Personal Finance"
                        value={newBookName}
                        onChange={(e) => setNewBookName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateBook()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input
                        id="description"
                        placeholder="What is this book for?"
                        value={newBookDescription}
                        onChange={(e) => setNewBookDescription(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateBook()}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="initial-amount">Initial Amount (Optional)</Label>
                      <Input
                        id="initial-amount"
                        type="number"
                        placeholder="0.00"
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateBook()}
                      />
                    </div>
                    <Button onClick={handleCreateBook} className="w-full" disabled={!newBookName.trim()}>
                      Create Book
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

            {books.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No books yet</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Create your first cashbook to start tracking your income and expenses.
                  </p>
                  <Button className="mt-6 gap-2" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Create your first book
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => (
                  <Card
                    key={book.id}
                    onClick={() => handleOpenBook(book.id)}
                    className="group relative flex flex-col justify-between overflow-hidden border-border/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg cursor-pointer"
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                    <CardHeader className="relative space-y-3 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                          <WalletCards className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
                          {book.currency}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold tracking-tight">{book.name}</CardTitle>
                        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                          {book.description || "No description provided"}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="relative space-y-4 pt-0">
                      <div className="rounded-xl bg-muted/60 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Net Balance</p>
                        <p
                          className={`mt-1 text-2xl font-extrabold tracking-tight ${
                            book.balance >= 0 ? "text-success" : "text-destructive"
                          }`}
                        >
                          {formatCurrency(book.balance)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Updated {formatDistanceToNow(new Date(book.updatedAt), { addSuffix: true })}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenBook(book.id)
                          }}
                          className="flex-1 gap-2"
                        >
                          Open Ledger
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBookToEdit(book)
                            setEditBookName(book.name)
                            setEditBookDescription(book.description || "")
                            setEditDialogOpen(true)
                          }}
                          className="shrink-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBookToDelete(book.id)
                            setDeleteDialogOpen(true)
                          }}
                          className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </div>
        </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-card/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-lg backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Button
            onClick={() => handleCashAction("income")}
            className="h-11 flex-1 gap-2 bg-success font-semibold hover:bg-success/90"
          >
            <Plus className="h-4 w-4" />
            Cash In
          </Button>
          <Button
            onClick={() => handleCashAction("expense")}
            variant="destructive"
            className="h-11 flex-1 gap-2 font-semibold"
          >
            <Minus className="h-4 w-4" />
            Cash Out
          </Button>
        </div>
      </div>

      <Dialog open={bookPickerOpen} onOpenChange={setBookPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a book</DialogTitle>
            <DialogDescription>
              Choose the book for this {entryType === "income" ? "Cash In" : "Cash Out"} entry.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {books.map((book) => (
              <Button
                key={book.id}
                type="button"
                variant="outline"
                className="h-auto w-full justify-between gap-4 px-4 py-3 text-left"
                onClick={() => handleSelectEntryBook(book)}
                disabled={selectingBook}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{book.name}</span>
                  {book.description && (
                    <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                      {book.description}
                    </span>
                  )}
                </span>
                <span className={`shrink-0 text-sm font-bold ${book.balance >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(book.balance)}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>Update the book name and description</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Book Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Personal Finance"
                value={editBookName}
                onChange={(e) => setEditBookName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditBook()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Input
                id="edit-description"
                placeholder="What is this book for?"
                value={editBookDescription}
                onChange={(e) => setEditBookDescription(e.target.value)}
              />
            </div>
            <Button onClick={handleEditBook} className="w-full" disabled={!editBookName.trim()}>
              Update Book
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Book Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this book and all its entries and categories. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedEntryBook && currentUserId && (
        <EntryDialog
          bookId={selectedEntryBook.id}
          userId={currentUserId}
          open={entryDialogOpen}
          onOpenChange={setEntryDialogOpen}
          categories={selectedBookCategories}
          initialType={entryType}
          onEntryCreated={loadBooks}
        />
      )}
    </div>
  )
}

export default function BooksPage() {
  return (
    <AuthGuard>
      <BooksContent />
    </AuthGuard>
  )
}

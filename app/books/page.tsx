"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
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
import { getBooks, createBook, deleteBook, updateBook, type Book } from "@/lib/store"
import { ArrowUpRight, Plus, Trash2, BookOpen, Edit2, WalletCards } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function BooksPage() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bookToDelete, setBookToDelete] = useState<string | null>(null)
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null)
  const [newBookName, setNewBookName] = useState("")
  const [newBookDescription, setNewBookDescription] = useState("")
  const [editBookName, setEditBookName] = useState("")
  const [editBookDescription, setEditBookDescription] = useState("")
  const [loading, setLoading] = useState(true)

  const loadBooks = async () => {
    const user = await getCurrentUser()
    if (!user) return

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

    await createBook(user.id, newBookName, "INR", newBookDescription)

    setNewBookName("")
    setNewBookDescription("")
    setDialogOpen(false)
    loadBooks()
  }

  const handleOpenBook = (bookId: string) => {
    router.push(`/ledger/${bookId}`)
  }

  const handleEditBook = async () => {
    if (!bookToEdit || !editBookName.trim()) return

    await updateBook(bookToEdit.id, {
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
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader activeBookId={null} />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background p-4 pb-24 md:p-7 md:pb-7">
          <div className="mx-auto max-w-6xl space-y-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">Your workspace</p>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">My books</h1>
                <p className="mt-2 text-sm md:text-base text-muted-foreground">Keep separate ledgers for everything that matters.</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 w-full gap-2 sm:w-auto">
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
                      />
                    </div>
                    <Button onClick={handleCreateBook} className="w-full" disabled={!newBookName.trim()}>
                      Create Book
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {books.length === 0 ? (
              <Card className="border-dashed bg-card/70">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BookOpen className="h-7 w-7" /></span>
                  <h2 className="text-lg font-bold">Create your first book</h2>
                  <p className="mb-5 mt-2 max-w-sm text-sm text-muted-foreground">Set up a dedicated place for personal, business, or project finances.</p>
                  <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Book
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => (
                  <Card
                    key={book.id}
                    className="group relative cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                    onClick={() => handleOpenBook(book.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><WalletCards className="h-5 w-5" /></span>
                          <div className="min-w-0">
                          <CardTitle className="mb-1 truncate">{book.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {book.description || "No description"}
                          </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="rounded-xl bg-muted/70 p-3.5">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net balance</p>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-2xl font-bold tracking-tight ${book.balance >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(book.balance)}</span>
                          <ArrowUpRight className={`h-5 w-5 ${book.balance >= 0 ? "text-success" : "rotate-90 text-destructive"}`} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                        <span>Last updated</span>
                        <span>{formatDistanceToNow(new Date(book.updatedAt), { addSuffix: true })}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 gap-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBookToEdit(book)
                            setEditBookName(book.name)
                            setEditBookDescription(book.description || "")
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setBookToDelete(book.id)
                            setDeleteDialogOpen(true)
                          }}
                          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
        </div>
      </div>
      <MobileNav />

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
    </AuthGuard>
  )
}

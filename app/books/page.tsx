"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
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
import { Plus, Trash2, BookOpen, Edit2 } from "lucide-react"
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

    const userBooks = getBooks(user.id)
    setBooks(userBooks)
    setLoading(false)
  }

  useEffect(() => {
    loadBooks()
  }, [])

  const handleCreateBook = async () => {
    const user = await getCurrentUser()
    if (!user || !newBookName.trim()) return

    createBook({
      userId: user.id,
      name: newBookName,
      description: newBookDescription,
      currency: "USD",
    })

    setNewBookName("")
    setNewBookDescription("")
    setDialogOpen(false)
    loadBooks()
  }

  const handleOpenBook = (bookId: string) => {
    router.push(`/ledger/${bookId}`)
  }

  const handleEditBook = () => {
    if (!bookToEdit || !editBookName.trim()) return

    updateBook(bookToEdit.id, {
      name: editBookName,
      description: editBookDescription,
    })

    setEditDialogOpen(false)
    setBookToEdit(null)
    setEditBookName("")
    setEditBookDescription("")
    loadBooks()
  }

  const handleDeleteBook = () => {
    if (!bookToDelete) return
    deleteBook(bookToDelete)
    setDeleteDialogOpen(false)
    setBookToDelete(null)
    loadBooks()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
          <main className="flex-1 overflow-auto bg-background p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
                <p className="text-muted-foreground">Select a book to view its ledger</p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
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
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-center text-lg text-muted-foreground">
                    No books yet. Create your first book to start tracking finances!
                  </p>
                  <Button onClick={() => setDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Book
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => (
                  <Card
                    key={book.id}
                    className="group cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => handleOpenBook(book.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="mb-1">{book.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {book.description || "No description"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">{formatCurrency(book.balance)}</span>
                          <span className={book.balance >= 0 ? "text-green-600" : "text-red-600"}>
                            {book.balance >= 0 ? "Net Balance" : "Net Balance"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
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

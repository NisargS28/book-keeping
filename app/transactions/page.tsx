"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import {
  getBooks,
  getActiveBookId,
  setActiveBookId,
  getTransactions,
  getCategories,
  getAccounts,
  createTransaction,
  deleteTransaction,
  type Transaction,
} from "@/lib/store"
import { Plus, Search, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"

export default function TransactionsPage() {
  const router = useRouter()
  const [activeBookId, setActiveBookIdState] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [formType, setFormType] = useState<"income" | "expense">("expense")
  const [formAmount, setFormAmount] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [formCategoryId, setFormCategoryId] = useState("")
  const [formAccountId, setFormAccountId] = useState("")
  const [formNotes, setFormNotes] = useState("")

  const loadData = () => {
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

    const txns = getTransactions(bookId)
    const cats = getCategories(bookId)
    const accs = getAccounts(bookId)

    setTransactions(txns)
    setFilteredTransactions(txns)
    setCategories(cats)
    setAccounts(accs)

    if (accs.length > 0 && !formAccountId) {
      setFormAccountId(accs[0].id)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let filtered = transactions

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter)
    }

    setFilteredTransactions(filtered)
  }, [searchQuery, typeFilter, transactions])

  const resetForm = () => {
    setFormType("expense")
    setFormAmount("")
    setFormDescription("")
    setFormDate(format(new Date(), "yyyy-MM-dd"))
    setFormCategoryId("")
    setFormNotes("")
    if (accounts.length > 0) {
      setFormAccountId(accounts[0].id)
    }
  }

  const handleCreateTransaction = () => {
    if (!activeBookId || !formAmount || !formDescription || !formCategoryId || !formAccountId) return

    createTransaction({
      bookId: activeBookId,
      accountId: formAccountId,
      categoryId: formCategoryId,
      type: formType,
      amount: Number.parseFloat(formAmount),
      description: formDescription,
      date: new Date(formDate).toISOString(),
      notes: formNotes || undefined,
    })

    resetForm()
    setDialogOpen(false)
    loadData()
  }

  const handleDeleteTransaction = () => {
    if (!transactionToDelete) return

    deleteTransaction(transactionToDelete)
    setDeleteDialogOpen(false)
    setTransactionToDelete(null)
    loadData()
  }

  if (loading || !activeBookId) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AuthGuard>
    )
  }

  const availableCategories = categories.filter((c) => c.type === formType)

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader activeBookId={activeBookId} onBookChange={loadData} />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background p-6">
            <div className="mx-auto max-w-6xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                  <p className="text-muted-foreground">Manage your income and expenses</p>
                </div>
                <Dialog
                  open={dialogOpen}
                  onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (open) resetForm()
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Transaction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Transaction</DialogTitle>
                      <DialogDescription>Record a new income or expense</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={formType}
                          onValueChange={(value: any) => {
                            setFormType(value)
                            setFormCategoryId("")
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formAmount}
                          onChange={(e) => setFormAmount(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="What was this for?"
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                      </div>

                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Account</Label>
                        <Select value={formAccountId} onValueChange={setFormAccountId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Additional details..."
                          value={formNotes}
                          onChange={(e) => setFormNotes(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleCreateTransaction}
                        className="w-full"
                        disabled={!formAmount || !formDescription || !formCategoryId || !formAccountId}
                      >
                        Add Transaction
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="income">Income Only</SelectItem>
                        <SelectItem value="expense">Expenses Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions List */}
              <Card>
                <CardContent className="p-0">
                  {filteredTransactions.length > 0 ? (
                    <div className="divide-y divide-border">
                      {filteredTransactions.map((transaction) => {
                        const category = categories.find((c) => c.id === transaction.categoryId)
                        const account = accounts.find((a) => a.id === transaction.accountId)

                        return (
                          <div key={transaction.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-3">
                                <div className="font-medium">{transaction.description}</div>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                    transaction.type === "income"
                                      ? "bg-success/10 text-success"
                                      : "bg-destructive/10 text-destructive"
                                  }`}
                                >
                                  {transaction.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{category?.name}</span>
                                <span>•</span>
                                <span>{account?.name}</span>
                                <span>•</span>
                                <span>{format(new Date(transaction.date), "MMM dd, yyyy")}</span>
                              </div>
                              {transaction.notes && (
                                <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <div
                                className={`text-lg font-semibold ${
                                  transaction.type === "income" ? "text-success" : "text-destructive"
                                }`}
                              >
                                {transaction.type === "income" ? "+" : "-"}${transaction.amount.toFixed(2)}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setTransactionToDelete(transaction.id)
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="text-center text-muted-foreground">
                        {searchQuery || typeFilter !== "all"
                          ? "No transactions found matching your filters"
                          : "No transactions yet. Add your first transaction to get started!"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this transaction and update the account balance. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTransaction}
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

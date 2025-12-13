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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentUser } from "@/lib/auth"
import {
  getBooks,
  getActiveBookId,
  setActiveBookId,
  getCategories,
  getAccounts,
  createCategory,
  createAccount,
  deleteCategory,
  deleteAccount,
  type Category,
  type Account,
} from "@/lib/store"
import { Plus, Trash2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [activeBookId, setActiveBookIdState] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense")
  const [newCategoryColor, setNewCategoryColor] = useState("#ef4444")

  // Account dialog
  const [accountDialogOpen, setAccountDialogOpen] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountType, setNewAccountType] = useState<"cash" | "bank" | "credit" | "investment" | "other">("bank")
  const [newAccountBalance, setNewAccountBalance] = useState("0")

  // Delete dialogs
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null)

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
    setCategories(getCategories(bookId))
    setAccounts(getAccounts(bookId))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateCategory = () => {
    if (!activeBookId || !newCategoryName.trim()) return

    createCategory({
      bookId: activeBookId,
      name: newCategoryName,
      type: newCategoryType,
      color: newCategoryColor,
    })

    setNewCategoryName("")
    setNewCategoryType("expense")
    setNewCategoryColor("#ef4444")
    setCategoryDialogOpen(false)
    loadData()
  }

  const handleDeleteCategory = () => {
    if (!categoryToDelete) return

    deleteCategory(categoryToDelete)
    setDeleteCategoryDialogOpen(false)
    setCategoryToDelete(null)
    loadData()
  }

  const handleCreateAccount = () => {
    if (!activeBookId || !newAccountName.trim()) return

    createAccount({
      bookId: activeBookId,
      name: newAccountName,
      type: newAccountType,
      balance: Number.parseFloat(newAccountBalance) || 0,
    })

    setNewAccountName("")
    setNewAccountType("bank")
    setNewAccountBalance("0")
    setAccountDialogOpen(false)
    loadData()
  }

  const handleDeleteAccount = () => {
    if (!accountToDelete) return

    deleteAccount(accountToDelete)
    setDeleteAccountDialogOpen(false)
    setAccountToDelete(null)
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

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <AppHeader activeBookId={activeBookId} onBookChange={loadData} />
        <div className="flex flex-1">
          <AppSidebar />
          <main className="flex-1 overflow-auto bg-background p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage categories and accounts for this book</p>
              </div>

              <Tabs defaultValue="categories" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="accounts">Accounts</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Category
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Category</DialogTitle>
                          <DialogDescription>Add a new category for income or expenses</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="cat-name">Category Name</Label>
                            <Input
                              id="cat-name"
                              placeholder="e.g., Groceries"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={newCategoryType} onValueChange={(value: any) => setNewCategoryType(value)}>
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
                            <Label htmlFor="cat-color">Color</Label>
                            <Input
                              id="cat-color"
                              type="color"
                              value={newCategoryColor}
                              onChange={(e) => setNewCategoryColor(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleCreateCategory} className="w-full" disabled={!newCategoryName.trim()}>
                            Create Category
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Income Categories</CardTitle>
                        <CardDescription>{incomeCategories.length} categories</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {incomeCategories.length > 0 ? (
                          <div className="space-y-2">
                            {incomeCategories.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between rounded-lg border border-border p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                                  <span className="font-medium">{cat.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setCategoryToDelete(cat.id)
                                    setDeleteCategoryDialogOpen(true)
                                  }}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-sm text-muted-foreground">No income categories</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Expense Categories</CardTitle>
                        <CardDescription>{expenseCategories.length} categories</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {expenseCategories.length > 0 ? (
                          <div className="space-y-2">
                            {expenseCategories.map((cat) => (
                              <div
                                key={cat.id}
                                className="flex items-center justify-between rounded-lg border border-border p-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                                  <span className="font-medium">{cat.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setCategoryToDelete(cat.id)
                                    setDeleteCategoryDialogOpen(true)
                                  }}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-sm text-muted-foreground">No expense categories</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="accounts" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Account</DialogTitle>
                          <DialogDescription>Add a new account to track</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="acc-name">Account Name</Label>
                            <Input
                              id="acc-name"
                              placeholder="e.g., Main Checking"
                              value={newAccountName}
                              onChange={(e) => setNewAccountName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Account Type</Label>
                            <Select value={newAccountType} onValueChange={(value: any) => setNewAccountType(value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank">Bank Account</SelectItem>
                                <SelectItem value="credit">Credit Card</SelectItem>
                                <SelectItem value="investment">Investment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="acc-balance">Initial Balance</Label>
                            <Input
                              id="acc-balance"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={newAccountBalance}
                              onChange={(e) => setNewAccountBalance(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleCreateAccount} className="w-full" disabled={!newAccountName.trim()}>
                            Create Account
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>All Accounts</CardTitle>
                      <CardDescription>{accounts.length} accounts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {accounts.length > 0 ? (
                        <div className="space-y-2">
                          {accounts.map((acc) => (
                            <div
                              key={acc.id}
                              className="flex items-center justify-between rounded-lg border border-border p-4"
                            >
                              <div className="space-y-1">
                                <div className="font-medium">{acc.name}</div>
                                <div className="text-sm text-muted-foreground capitalize">{acc.type}</div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-lg font-semibold">${acc.balance.toFixed(2)}</div>
                                  <div className="text-xs text-muted-foreground">Balance</div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setAccountToDelete(acc.id)
                                    setDeleteAccountDialogOpen(true)
                                  }}
                                  className="text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-sm text-muted-foreground">No accounts yet</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>

      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this category. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
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

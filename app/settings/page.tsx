"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppHeader } from "@/components/app-header"
import { AuthGuard } from "@/components/auth-guard"
import { getCurrentUser, logout, updateUserProfile, linkWhatsAppPhone } from "@/lib/auth"
import {
  getBooks,
  getActiveBookId,
  setActiveBookId,
  getCategories,
  createCategory,
  deleteCategory,
} from "@/lib/store"
import { Trash2, Plus, ArrowLeft, User, MessageSquare, Tag, Palette } from "lucide-react"
import { Category } from "@/lib/types"

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") || "profile"

  const [activeTab, setActiveTab] = useState<string>(tabParam)
  const [user, setUser] = useState<any>(null)
  const [activeBookId, setActiveBookIdState] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  // Profile edit state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState("")
  const [editProfileImage, setEditProfileImage] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState("")

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#8b5cf6")
  const [savingCategory, setSavingCategory] = useState(false)

  // Delete dialogs
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState(false)

  // WhatsApp linking state
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState("")
  const [currentWhatsappPhone, setCurrentWhatsappPhone] = useState<string | null>(null)
  const [savingWhatsApp, setSavingWhatsApp] = useState(false)
  const [whatsappError, setWhatsappError] = useState("")

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const loadData = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)
      setEditDisplayName(currentUser.displayName || currentUser.email || "")
      setEditProfileImage(currentUser.profileImage || "")
      
      // Load WhatsApp phone if available
      const { supabase } = await import("@/lib/supabase")
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("whatsapp_phone")
        .eq("id", currentUser.id)
        .single()
      
      if (profile?.whatsapp_phone) {
        const cleanPhone = profile.whatsapp_phone.replace("whatsapp:", "")
        setCurrentWhatsappPhone(cleanPhone)
      }

      const books = await getBooks(currentUser.id)
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
      const cats = await getCategories(bookId)
      setCategories(cats)
      setLoading(false)
    } catch (error) {
      console.error("Error loading data:", error)
      router.push("/login")
    }
  }

  useEffect(() => {
    loadData()
    // Load saved theme
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null
    if (savedTheme) {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    }
  }, [])

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = window.document.documentElement
    if (newTheme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.toggle("dark", prefersDark)
    } else {
      root.classList.toggle("dark", newTheme === "dark")
    }
  }

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    applyTheme(newTheme)
  }

  const handleUpdateProfile = async () => {
    if (!user || !editDisplayName.trim()) return

    try {
      setSavingProfile(true)
      setProfileError("")
      await updateUserProfile(user.id, {
        displayName: editDisplayName,
        profileImage: editProfileImage || undefined,
      })
      setUser({
        ...user,
        displayName: editDisplayName,
        profileImage: editProfileImage || undefined,
      })
      setProfileDialogOpen(false)
      window.location.reload()
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setProfileError(error?.message || "Failed to update profile.")
    } finally {
      setSavingProfile(false)
    }
  }

  const handleLinkWhatsApp = async () => {
    if (!user || !whatsappPhone.trim()) {
      setWhatsappError("Please enter a valid WhatsApp number")
      return
    }

    try {
      setSavingWhatsApp(true)
      setWhatsappError("")
      
      let formattedPhone = whatsappPhone.trim()
      if (formattedPhone.startsWith("whatsapp:")) {
        formattedPhone = formattedPhone.replace("whatsapp:", "")
      }
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone
      }

      const result = await linkWhatsAppPhone(user.id, formattedPhone)
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      setCurrentWhatsappPhone(formattedPhone)
      setWhatsappDialogOpen(false)
      setWhatsappPhone("")
    } catch (error: any) {
      console.error("Error linking WhatsApp:", error)
      setWhatsappError(error?.message || "Failed to link WhatsApp number.")
    } finally {
      setSavingWhatsApp(false)
    }
  }

  const handleUnlinkWhatsApp = async () => {
    if (!user) return

    try {
      setSavingWhatsApp(true)
      setWhatsappError("")
      const result = await linkWhatsAppPhone(user.id, "")
      if (result.error) {
        throw new Error(result.error.message)
      }
      setCurrentWhatsappPhone(null)
    } catch (error: any) {
      console.error("Error unlinking WhatsApp:", error)
      setWhatsappError(error?.message || "Failed to unlink WhatsApp number.")
    } finally {
      setSavingWhatsApp(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !activeBookId) return

    try {
      setSavingCategory(true)
      const newCategory = await createCategory({
        bookId: activeBookId,
        name: newCategoryName,
        color: newCategoryColor,
      })
      setCategories([...categories, newCategory])
      setNewCategoryName("")
      setNewCategoryColor("#8b5cf6")
      setCategoryDialogOpen(false)
    } catch (error) {
      console.error("Error creating category:", error)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      setDeletingCategory(true)
      await deleteCategory(categoryToDelete)
      setCategories(categories.filter((c) => c.id !== categoryToDelete))
      setDeleteCategoryDialogOpen(false)
      setCategoryToDelete(null)
    } catch (error) {
      console.error("Error deleting category:", error)
    } finally {
      setDeletingCategory(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (loading || !activeBookId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader activeBookId={activeBookId} />
      <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/books")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your profile, integrations, and preferences</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="text-xs md:text-sm gap-1.5">
                <User className="h-4 w-4 hidden sm:inline" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="text-xs md:text-sm gap-1.5">
                <MessageSquare className="h-4 w-4 hidden sm:inline" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs md:text-sm gap-1.5">
                <Tag className="h-4 w-4 hidden sm:inline" />
                Categories
              </TabsTrigger>
              <TabsTrigger value="general" className="text-xs md:text-sm gap-1.5">
                <Palette className="h-4 w-4 hidden sm:inline" />
                General
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>Manage your public display name and avatar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-5">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt=""
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-primary-foreground text-2xl font-bold">
                        {editDisplayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-foreground truncate">{user?.displayName || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>

                  <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                    <Button onClick={() => setProfileDialogOpen(true)} className="w-full">
                      Edit Profile
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>Update your display name and avatar</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Display Name</label>
                          <Input
                            placeholder="Your name"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Profile Image URL (Optional)</label>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            value={editProfileImage}
                            onChange={(e) => setEditProfileImage(e.target.value)}
                          />
                        </div>
                        {profileError && (
                          <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg">
                            {profileError}
                          </div>
                        )}
                        <Button onClick={handleUpdateProfile} disabled={savingProfile} className="w-full">
                          {savingProfile ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-success" />
                    WhatsApp Integration
                  </CardTitle>
                  <CardDescription>Add income and expense entries instantly via WhatsApp</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentWhatsappPhone ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3.5 bg-success/10 border border-success/30 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-success">Connected</p>
                          <p className="text-xs text-foreground font-mono">{currentWhatsappPhone}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleUnlinkWhatsApp}
                          disabled={savingWhatsApp}
                        >
                          {savingWhatsApp ? "Unlinking..." : "Unlink"}
                        </Button>
                      </div>
                      <div className="p-4 bg-muted/60 border border-border/80 rounded-xl space-y-2 text-xs">
                        <p className="font-semibold text-foreground">How to send transactions:</p>
                        <ol className="text-muted-foreground space-y-1.5 list-decimal list-inside">
                          <li>Send <code className="bg-muted px-1 py-0.5 rounded font-mono">join refer-sick</code> to <strong>+14155238886</strong> for sandbox access.</li>
                          <li>Message format: <code className="bg-muted px-1 py-0.5 rounded font-mono">BookName, income/expense, amount, category, payment mode, description</code></li>
                          <li>Example: <code className="bg-muted px-1 py-0.5 rounded font-mono">Personal, income, 5000, Salary, Bank, Monthly salary</code></li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Link your WhatsApp number to record expenses and income on the go.
                      </p>
                      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
                        <Button onClick={() => setWhatsappDialogOpen(true)} className="w-full">
                          Link WhatsApp Number
                        </Button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Link WhatsApp Number</DialogTitle>
                            <DialogDescription>
                              Enter your phone number including country code (e.g. +919876543210)
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Phone Number</label>
                              <Input
                                placeholder="+919876543210"
                                value={whatsappPhone}
                                onChange={(e) => setWhatsappPhone(e.target.value)}
                              />
                            </div>
                            {whatsappError && (
                              <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-lg">
                                {whatsappError}
                              </div>
                            )}
                            <Button onClick={handleLinkWhatsApp} disabled={savingWhatsApp} className="w-full">
                              {savingWhatsApp ? "Linking..." : "Link Number"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Manage Categories</CardTitle>
                    <CardDescription>Custom categories for your current active book</CardDescription>
                  </div>
                  <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                    <Button onClick={() => setCategoryDialogOpen(true)} size="sm" className="gap-1.5">
                      <Plus className="h-4 w-4" />
                      Add Category
                    </Button>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>New Category</DialogTitle>
                        <DialogDescription>Add a category to categorize your transactions</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category Name</label>
                          <Input
                            placeholder="e.g. Groceries"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Color</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={newCategoryColor}
                              onChange={(e) => setNewCategoryColor(e.target.value)}
                              className="h-10 w-12 rounded cursor-pointer border border-border"
                            />
                            <span className="text-xs font-mono text-muted-foreground">{newCategoryColor}</span>
                          </div>
                        </div>
                        <Button onClick={handleCreateCategory} disabled={savingCategory} className="w-full">
                          {savingCategory ? "Creating..." : "Create Category"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categories.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No custom categories found.</p>
                    ) : (
                      categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-3 w-3 rounded-full shadow-sm"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="font-semibold text-sm">{cat.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCategoryToDelete(cat.id)
                              setDeleteCategoryDialogOpen(true)
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Category</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this category? Existing transactions will become uncategorized.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeleteCategoryDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteCategory}
                      disabled={deletingCategory}
                    >
                      {deletingCategory ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>

            {/* General Settings Tab */}
            <TabsContent value="general" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance & Theme</CardTitle>
                  <CardDescription>Customize how CashBook looks on your device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <Button
                        key={t}
                        variant={theme === t ? "default" : "outline"}
                        onClick={() => handleThemeChange(t)}
                        className="capitalize"
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session</CardTitle>
                  <CardDescription>Sign out of your active session</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={handleLogout} className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading settings...</div>}>
        <SettingsContent />
      </Suspense>
    </AuthGuard>
  )
}

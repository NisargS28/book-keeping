"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { AppHeader } from "@/components/app-header"
import { getCurrentUser, logout, updateUserProfile, linkWhatsAppPhone } from "@/lib/auth"
import {
  getBooks,
  getActiveBookId,
  setActiveBookId,
  getCategories,
  createCategory,
  deleteCategory,
} from "@/lib/store"
import { Trash2, Plus } from "lucide-react"
import { Category } from "@/lib/types"

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeBookId, setActiveBookIdState] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")

  // Profile edit state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [editDisplayName, setEditDisplayName] = useState("")
  const [editProfileImage, setEditProfileImage] = useState("")
  const [editBio, setEditBio] = useState("")
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
      const { supabase } = await import('@/lib/supabase')
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('whatsapp_phone')
        .eq('id', currentUser.id)
        .single()
      
      if (profile?.whatsapp_phone) {
        // Remove whatsapp: prefix if it exists (from old format)
        const cleanPhone = profile.whatsapp_phone.replace('whatsapp:', '')
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
      // Reload the page to update the header
      window.location.reload()
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setProfileError(error?.message || "Failed to update profile. Please make sure the user_profiles table exists in Supabase.")
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
      
      // Format phone number: just ensure it has + prefix
      let formattedPhone = whatsappPhone.trim()
      
      // Remove whatsapp: prefix if user accidentally added it
      if (formattedPhone.startsWith('whatsapp:')) {
        formattedPhone = formattedPhone.replace('whatsapp:', '')
      }
      
      // Add + if missing
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone
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
      setWhatsappError(error?.message || "Failed to link WhatsApp number. Please try again.")
    } finally {
      setSavingWhatsApp(false)
    }
  }

  const handleUnlinkWhatsApp = async () => {
    if (!user) return

    try {
      setSavingWhatsApp(true)
      setWhatsappError("")
      
      const result = await linkWhatsAppPhone(user.id, '')
      
      if (result.error) {
        throw new Error(result.error.message)
      }
      
      setCurrentWhatsappPhone(null)
    } catch (error: any) {
      console.error("Error unlinking WhatsApp:", error)
      setWhatsappError(error?.message || "Failed to unlink WhatsApp number. Please try again.")
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

  const handleDeleteAccount = async () => {
    // TODO: Implement account deletion with Supabase
    console.log("Delete account not yet implemented")
  }

  if (loading || !activeBookId) {
    return (
      <div className="flex h-screen">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <AppHeader activeBookId={null} />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <AppHeader activeBookId={activeBookId} />
        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
              <p className="text-sm md:text-base text-gray-500">Manage your preferences and categories</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="text-xs md:text-sm">Profile</TabsTrigger>
                <TabsTrigger value="general" className="text-xs md:text-sm">General</TabsTrigger>
                <TabsTrigger value="categories" className="text-xs md:text-sm">Categories</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Manage your profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                        {editDisplayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 mb-2">Display Name</p>
                        <p className="text-xl font-semibold">{user?.displayName || "User"}</p>
                        <p className="text-sm text-gray-500 mt-2">{user?.email}</p>
                      </div>
                    </div>

                    <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                      <Button onClick={() => setProfileDialogOpen(true)} className="w-full">
                        Edit Profile
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                          <DialogDescription>Update your profile information</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Display Name</label>
                            <Input
                              placeholder="Your display name"
                              value={editDisplayName}
                              onChange={(e) => setEditDisplayName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Profile Image URL (Optional)</label>
                            <Input
                              placeholder="https://example.com/image.jpg"
                              value={editProfileImage}
                              onChange={(e) => setEditProfileImage(e.target.value)}
                            />
                          </div>
                          {profileError && (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
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

                <Card>
                  <CardHeader>
                    <CardTitle>WhatsApp Integration</CardTitle>
                    <CardDescription>Add entries via WhatsApp messages</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentWhatsappPhone ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">Connected</p>
                            <p className="text-xs text-green-700 dark:text-green-300">{currentWhatsappPhone}</p>
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
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg space-y-2">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">📱 How to use:</p>
                          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                            <li>Send a WhatsApp message "join refer-sick" to <strong>+14155238886</strong> for sandbox access.</li>
                            <li>Use format: <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">BookName, income/expense, amount, category, payment mode, description</code></li>
                            <li>Example: <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">Personal, income, 5000, Salary, Bank, Monthly salary</code></li>
                          </ol>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Link your WhatsApp number to add entries by sending messages.
                        </p>
                        <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
                          <Button onClick={() => setWhatsappDialogOpen(true)} className="w-full">
                            Link WhatsApp Number
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Link WhatsApp Number</DialogTitle>
                              <DialogDescription>
                                Enter your WhatsApp phone number to enable adding entries via WhatsApp
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">WhatsApp Phone Number</label>
                                <Input
                                  placeholder="+1234567890"
                                  value={whatsappPhone}
                                  onChange={(e) => setWhatsappPhone(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Include country code (e.g., +1 for US, +91 for India)
                                </p>
                              </div>
                              {whatsappError && (
                                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
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

              {/* General Settings Tab */}
              <TabsContent value="general" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>Choose your preferred theme</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      {(["light", "dark", "system"] as const).map((t) => (
                        <Button
                          key={t}
                          variant={theme === t ? "default" : "outline"}
                          onClick={() => handleThemeChange(t)}
                          className="flex-1 capitalize"
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Manage your account</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" onClick={handleLogout} className="w-full">
                      Logout
                    </Button>

                    <AlertDialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Categories</CardTitle>
                      <CardDescription>Manage your transaction categories</CardDescription>
                    </div>
                    <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                      <Button onClick={() => setCategoryDialogOpen(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                      </Button>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Category</DialogTitle>
                          <DialogDescription>Add a new category for organizing entries</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                              placeholder="e.g., Groceries, Salary, Rent"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Color</label>
                            <div className="flex gap-2 items-center">
                              <input
                                type="color"
                                value={newCategoryColor}
                                onChange={(e) => setNewCategoryColor(e.target.value)}
                                className="w-10 h-10 rounded cursor-pointer"
                              />
                              <span className="text-sm text-gray-500">{newCategoryColor}</span>
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
                        <p className="text-gray-500 text-sm">No categories yet. Create one to get started!</p>
                      ) : (
                        categories.map((category) => (
                          <div key={category.id} className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              <span className="font-medium">{category.name}</span>
                            </div>
                            <AlertDialog open={deleteCategoryDialogOpen && categoryToDelete === category.id} onOpenChange={setDeleteCategoryDialogOpen}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setCategoryToDelete(category.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteCategory} disabled={deletingCategory} className="bg-red-600 hover:bg-red-700">
                                  {deletingCategory ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

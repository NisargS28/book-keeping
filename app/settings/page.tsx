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
import {
  Trash2,
  Plus,
  ArrowLeft,
  User,
  MessageSquare,
  Tag,
  Palette,
  ShieldCheck,
  KeyRound,
  Lock,
  Copy,
  Check,
  Download,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { Category } from "@/lib/types"
import { regenerateRecoverySecret, changeEncryptionPassphrase } from "@/lib/encryption"

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

  // Security / Encryption state
  const [regenDialogOpen, setRegenDialogOpen] = useState(false)
  const [regenPassphrase, setRegenPassphrase] = useState("")
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenError, setRegenError] = useState("")
  const [newRecoverySecret, setNewRecoverySecret] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const [changePassDialogOpen, setChangePassDialogOpen] = useState(false)
  const [oldPassphrase, setOldPassphrase] = useState("")
  const [newPassphrase, setNewPassphrase] = useState("")
  const [confirmNewPassphrase, setConfirmNewPassphrase] = useState("")
  const [changePassLoading, setChangePassLoading] = useState(false)
  const [changePassError, setChangePassError] = useState("")
  const [changePassSuccess, setChangePassSuccess] = useState("")

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
      const cats = await getCategories(bookId, currentUser.id)
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
    const currentUser = user
    if (!currentUser) return

    try {
      setSavingCategory(true)
      const newCategory = await createCategory({
        bookId: activeBookId,
        name: newCategoryName,
        color: newCategoryColor,
      }, currentUser.id)
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

  const handleRegenerateRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !regenPassphrase) return
    setRegenLoading(true)
    setRegenError("")
    try {
      const { recoverySecret } = await regenerateRecoverySecret(regenPassphrase, user.id)
      setNewRecoverySecret(recoverySecret)
      setRegenPassphrase("")
    } catch (err: any) {
      setRegenError(err?.message || "Failed to generate recovery secret. Please check your passphrase.")
    } finally {
      setRegenLoading(false)
    }
  }

  const handleCopyRecoverySecret = async () => {
    if (!newRecoverySecret) return
    await navigator.clipboard.writeText(newRecoverySecret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const handleDownloadRecoverySecret = () => {
    if (!newRecoverySecret) return
    const blob = new Blob(
      [
        `CashBook Zero-Knowledge Encryption Recovery Secret\n` +
          `==================================================\n\n` +
          `Save this in a secure location (e.g. password manager, safe offline storage).\n` +
          `Do NOT share this secret with anyone. Our servers do not have this key.\n\n` +
          `Recovery Secret:\n${newRecoverySecret}\n`,
      ],
      { type: "text/plain" }
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cashbook-recovery-secret.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleChangePassphrase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (newPassphrase.length < 12) {
      setChangePassError("New passphrase must be at least 12 characters.")
      return
    }
    if (newPassphrase !== confirmNewPassphrase) {
      setChangePassError("New passphrases do not match.")
      return
    }

    setChangePassLoading(true)
    setChangePassError("")
    setChangePassSuccess("")

    try {
      await changeEncryptionPassphrase(oldPassphrase, newPassphrase, user.id)
      setChangePassSuccess("Encryption passphrase updated successfully.")
      setOldPassphrase("")
      setNewPassphrase("")
      setConfirmNewPassphrase("")
      setTimeout(() => {
        setChangePassDialogOpen(false)
        setChangePassSuccess("")
      }, 1500)
    } catch (err: any) {
      setChangePassError(err?.message || "Failed to change passphrase. Verify your current passphrase.")
    } finally {
      setChangePassLoading(false)
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile" className="text-xs md:text-sm gap-1.5">
                <User className="h-4 w-4 hidden sm:inline" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="text-xs md:text-sm gap-1.5">
                <ShieldCheck className="h-4 w-4 hidden sm:inline text-primary" />
                Security
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

            {/* Security & Encryption Tab */}
            <TabsContent value="security" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Zero-Knowledge Encryption
                  </CardTitle>
                  <CardDescription>
                    All books, categories, and ledger entries are client-side encrypted with AES-256-GCM before reaching the server.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs leading-relaxed">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <Lock className="h-4 w-4" />
                      <span>End-to-End Client Encryption Active</span>
                    </div>
                    <p className="text-muted-foreground">
                      The database only stores ciphertext. Your encryption key is held only in browser memory and is wiped whenever you lock or refresh.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 pt-2">
                    {/* Regenerate Recovery Secret Card */}
                    <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <KeyRound className="h-4 w-4 text-amber-500" />
                          <span>Emergency Recovery Secret</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Generate or re-save your 64-character recovery secret to restore access if you ever forget your passphrase.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-xs font-semibold"
                        onClick={() => {
                          setNewRecoverySecret(null)
                          setRegenError("")
                          setRegenPassphrase("")
                          setRegenDialogOpen(true)
                        }}
                      >
                        <KeyRound className="h-4 w-4 text-amber-500" />
                        Generate / Save Recovery Secret
                      </Button>
                    </div>

                    {/* Change Passphrase Card */}
                    <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-semibold text-sm">
                          <Lock className="h-4 w-4 text-primary" />
                          <span>Change Passphrase</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Update your encryption passphrase without re-encrypting your existing ledger records.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-xs font-semibold"
                        onClick={() => {
                          setOldPassphrase("")
                          setNewPassphrase("")
                          setConfirmNewPassphrase("")
                          setChangePassError("")
                          setChangePassSuccess("")
                          setChangePassDialogOpen(true)
                        }}
                      >
                        <Lock className="h-4 w-4 text-primary" />
                        Change Passphrase
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recovery Secret Dialog */}
              <Dialog open={regenDialogOpen} onOpenChange={setRegenDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-amber-500" />
                      Recovery Secret
                    </DialogTitle>
                    <DialogDescription>
                      {newRecoverySecret
                        ? "Save this recovery secret in a secure location. It can unlock your ledger if you forget your passphrase."
                        : "Enter your current encryption passphrase to generate a fresh recovery secret."}
                    </DialogDescription>
                  </DialogHeader>

                  {newRecoverySecret ? (
                    <div className="space-y-4 pt-2">
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4" />
                          One-Time Emergency Secret
                        </span>
                        <div className="rounded-lg bg-background p-3 border border-border font-mono text-xs font-semibold break-all select-all">
                          {(newRecoverySecret.match(/.{1,8}/g) ?? []).join("-")}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={handleCopyRecoverySecret}
                        >
                          {copiedSecret ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          {copiedSecret ? "Copied!" : "Copy Secret"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={handleDownloadRecoverySecret}
                        >
                          <Download className="h-4 w-4" />
                          Download .txt
                        </Button>
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => {
                          setRegenDialogOpen(false)
                          setNewRecoverySecret(null)
                        }}
                      >
                        I Have Saved It
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegenerateRecovery} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground block">
                          Current Encryption Passphrase
                        </label>
                        <Input
                          type="password"
                          placeholder="Enter your current passphrase"
                          value={regenPassphrase}
                          onChange={(e) => setRegenPassphrase(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>

                      {regenError && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-medium">
                          {regenError}
                        </div>
                      )}

                      <Button type="submit" disabled={regenLoading || !regenPassphrase} className="w-full">
                        {regenLoading ? "Generating..." : "Generate New Secret"}
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              {/* Change Passphrase Dialog */}
              <Dialog open={changePassDialogOpen} onOpenChange={setChangePassDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Change Passphrase
                    </DialogTitle>
                    <DialogDescription>
                      Enter your current passphrase and choose a new passphrase of at least 12 characters.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleChangePassphrase} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground block">
                        Current Passphrase
                      </label>
                      <Input
                        type="password"
                        placeholder="Current passphrase"
                        value={oldPassphrase}
                        onChange={(e) => setOldPassphrase(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground block">
                        New Passphrase (min 12 chars)
                      </label>
                      <Input
                        type="password"
                        placeholder="New passphrase"
                        value={newPassphrase}
                        onChange={(e) => setNewPassphrase(e.target.value)}
                        required
                        minLength={12}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground block">
                        Confirm New Passphrase
                      </label>
                      <Input
                        type="password"
                        placeholder="Confirm new passphrase"
                        value={confirmNewPassphrase}
                        onChange={(e) => setConfirmNewPassphrase(e.target.value)}
                        required
                      />
                    </div>

                    {changePassError && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20 font-medium">
                        {changePassError}
                      </div>
                    )}

                    {changePassSuccess && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 font-medium flex items-center gap-1.5">
                        <Check className="h-4 w-4 shrink-0" />
                        <span>{changePassSuccess}</span>
                      </div>
                    )}

                    <Button type="submit" disabled={changePassLoading} className="w-full">
                      {changePassLoading ? "Updating..." : "Update Passphrase"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
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

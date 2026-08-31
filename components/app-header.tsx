"use client"

import {
  BookA as Book2,
  ChevronDown,
  LogOut,
  User,
  Settings,
  MessageSquare,
  Tag,
  Palette,
  Lock,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser, logout } from "@/lib/auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getBook } from "@/lib/store"
import { useEncryption } from "@/components/encryption-provider"
import Link from "next/link"

interface AppHeaderProps {
  activeBookId: string | null
  onBookChange?: () => void
}

export function AppHeader({ activeBookId, onBookChange }: AppHeaderProps) {
  const router = useRouter()
  const { lock } = useEncryption()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [activeBookName, setActiveBookName] = useState<string | null>(null)
  
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser()
      if (user) {
        setUserId(user.id)
        setDisplayName(user.displayName ?? null)
        setUserEmail(user.email ?? null)
        setProfileImage(user.profileImage || null)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadBook = async () => {
      if (!activeBookId || !userId) {
        setActiveBookName(null)
        return
      }
      const book = await getBook(activeBookId, userId)
      setActiveBookName(book?.name ?? null)
    }
    loadBook()
  }, [activeBookId, userId])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-card/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-7">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Link
            href="/books"
            className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Book2 className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight md:text-xl">CashBook</span>
          </Link>

          {activeBookName && (
            <>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <Button
                variant="ghost"
                className="hidden max-w-56 gap-2 sm:inline-flex"
                onClick={() => {
                  router.push("/books")
                  onBookChange?.()
                }}
              >
                <span className="truncate font-medium">{activeBookName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* End-to-End Encryption Badge */}
          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:flex shadow-xs select-none">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>End-to-End Encrypted</span>
          </div>


          {/* Profile & Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 rounded-full px-2.5">
              {profileImage ? (
                <img src={profileImage} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {(displayName ?? userEmail ?? "U").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden font-medium text-sm md:inline">
                {displayName || userEmail || "User"}
              </span>
              <ChevronDown className="hidden md:inline h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal py-2 px-3">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">
                  {displayName || "User"}
                </p>
                {userEmail && (
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {userEmail}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            {/* Edit Profile */}
            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => router.push("/settings?tab=profile")}
            >
              <User className="h-4 w-4 text-primary" />
              <span>Edit Profile</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            {/* Settings Options visible below Edit Profile */}
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Settings
            </div>

            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => router.push("/settings?tab=security")}
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Security & Recovery</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => router.push("/settings?tab=whatsapp")}
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>WhatsApp Integration</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => router.push("/settings?tab=categories")}
            >
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span>Manage Categories</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => router.push("/settings?tab=general")}
            >
              <Palette className="h-4 w-4 text-muted-foreground" />
              <span>Theme & Preferences</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="cursor-pointer gap-2"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>All Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Lock Vault */}
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-amber-600 dark:text-amber-400 focus:text-amber-600"
              onClick={() => lock()}
            >
              <Lock className="h-4 w-4" />
              <span>Lock Vault</span>
            </DropdownMenuItem>

            {/* Sign Out */}
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

"use client"

import { BookA as Book2, ChevronDown, LogOut, User, Menu, LayoutDashboard, Settings, Book, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { getCurrentUser, logout } from "@/lib/auth"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getBook } from "@/lib/store"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  activeBookId: string | null
  onBookChange?: () => void
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Books", href: "/books", icon: Book },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function AppHeader({ activeBookId, onBookChange }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [activeBookName, setActiveBookName] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser()
      if (user) {
        setDisplayName(user.displayName ?? null)
        setProfileImage(user.profileImage || null)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadBook = async () => {
      if (!activeBookId) {
        setActiveBookName(null)
        return
      }
      const book = await getBook(activeBookId)
      setActiveBookName(book?.name ?? null)
    }
    loadBook()
  }, [activeBookId])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-card/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-7">
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="flex items-center gap-2 border-b px-6 py-5">
                <SheetTitle className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Book2 className="h-5 w-5" /></span>
                  <span className="text-xl font-semibold">CashBook</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Book2 className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight md:text-xl">CashBook</span>
          </div>

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
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 rounded-full px-2.5">
              {profileImage ? (
                <img src={profileImage} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {(displayName ?? "U").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden md:inline">{displayName ?? "User"}</span>
              <ChevronDown className="hidden md:inline h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {displayName ?? "User"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

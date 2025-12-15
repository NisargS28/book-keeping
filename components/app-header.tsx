"use client"

import { BookA as Book2, ChevronDown, LogOut, User, Menu, LayoutDashboard, Settings, Book } from "lucide-react"
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
  { name: "Settings", href: "/settings", icon: Settings },
]

export function AppHeader({ activeBookId, onBookChange }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => {
    const load = async () => {
      const user = await getCurrentUser()
      if (user) {
        setDisplayName(user.displayName)
        setProfileImage(user.profileImage || null)
      }
    }
    load()
  }, [])
  const activeBook = activeBookId ? getBook(activeBookId) : null

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetHeader className="flex items-center gap-2 border-b px-6 py-4">
                <SheetTitle className="flex items-center gap-2">
                  <Book2 className="h-6 w-6 text-primary" />
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
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
          
          <div className="flex items-center gap-2">
            <Book2 className="h-6 w-6 text-primary" />
            <span className="text-lg md:text-xl font-semibold">CashBook</span>
          </div>

          {activeBook && (
            <>
              <div className="h-6 w-px bg-border" />
              <Button
                variant="ghost"
                className="gap-2"
                onClick={() => {
                  router.push("/books")
                  onBookChange?.()
                }}
              >
                <span className="font-medium">{activeBook.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <User className="h-4 w-4" />
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

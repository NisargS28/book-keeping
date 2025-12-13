"use client"

import { BookA as Book2, ChevronDown, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser, logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { getBook } from "@/lib/store"

interface AppHeaderProps {
  activeBookId: string | null
  onBookChange?: () => void
}

export function AppHeader({ activeBookId, onBookChange }: AppHeaderProps) {
  const router = useRouter()
  const user = getCurrentUser()
  const activeBook = activeBookId ? getBook(activeBookId) : null

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Book2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-semibold">CashBook</span>
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
              <span>{user?.name || user?.email}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              {user?.email}
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

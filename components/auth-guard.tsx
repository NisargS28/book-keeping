"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/types"
import { EncryptionProvider, useEncryption } from "@/components/encryption-provider"
import { EncryptionSetupScreen } from "@/components/encryption-setup-screen"
import { EncryptionUnlockScreen } from "@/components/encryption-unlock-screen"
import { Loader2 } from "lucide-react"

function EncryptionGate({ children }: { children: React.ReactNode }) {
  const { state } = useEncryption()

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Checking encryption status...</p>
        </div>
      </div>
    )
  }

  if (state.status === "locked") {
    if (state.needsSetup) {
      return <EncryptionSetupScreen />
    }
    return <EncryptionUnlockScreen />
  }

  return <>{children}</>
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push("/login")
      } else {
        setUser(currentUser as any)
      }
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <EncryptionProvider userId={user.id}>
      <EncryptionGate>{children}</EncryptionGate>
    </EncryptionProvider>
  )
}

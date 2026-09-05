"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"

export const PASSWORD_RECOVERY_STORAGE_KEY = "ledgerly-password-recovery"

function hasRecoveryParameters() {
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))

  return searchParams.get("type") === "recovery" || hashParams.get("type") === "recovery"
}

export function PasswordRecoveryRedirect() {
  useEffect(() => {
    const redirectToResetPassword = (preserveUrlParameters = false) => {
      if (window.location.pathname === "/reset-password") return

      const suffix = preserveUrlParameters
        ? `${window.location.search}${window.location.hash}`
        : ""
      window.location.replace(`/reset-password${suffix}`)
    }

    if (hasRecoveryParameters()) {
      sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "true")
      if (window.location.pathname !== "/reset-password") {
        redirectToResetPassword(true)
        return
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        sessionStorage.setItem(PASSWORD_RECOVERY_STORAGE_KEY, "true")
        redirectToResetPassword()
      } else if (event === "SIGNED_OUT") {
        sessionStorage.removeItem(PASSWORD_RECOVERY_STORAGE_KEY)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}

"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function NavigationProgress() {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)

  useEffect(() => {
    setIsNavigating(false)
  }, [pathname])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element | null
      const link = target?.closest("a[href]") as HTMLAnchorElement | null

      if (
        !link ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank" ||
        link.hasAttribute("download")
      ) {
        return
      }

      const destination = new URL(link.href, window.location.href)
      const isInternal = destination.origin === window.location.origin
      const isNewRoute = destination.pathname !== window.location.pathname || destination.search !== window.location.search

      if (isInternal && isNewRoute) {
        setIsNavigating(true)
      }
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`navigation-progress ${isNavigating ? "navigation-progress-active" : ""}`}
    />
  )
}

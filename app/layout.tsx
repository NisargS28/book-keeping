import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import { NavigationProgress } from "@/components/navigation-progress"
import "./globals.css"

export const metadata: Metadata = {
  title: "Ledgerly - Professional Bookkeeping",
  description: "Manage multiple books, track transactions, and analyze your finances",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ledgerly",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: "/ledgerly-icon-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/ledgerly-icon-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/ledgerly-icon-192x192.png",
        type: "image/png",
      },
    ],
    apple: "/ledgerly-apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0879c9",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <NavigationProgress />
        {children}
        <Analytics />
      </body>
    </html>
  )
}

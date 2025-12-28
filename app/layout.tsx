import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { ConditionalLayout } from "@/components/shared/conditional-layout"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Travel App - Your Premium Travel Companion",
  description: "Mobile-first travel platform for discovering and booking amazing experiences",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: {
    width: "device-width",
    initialScale: 1,
    interactiveWidget: "resizes-content",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Travel App",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

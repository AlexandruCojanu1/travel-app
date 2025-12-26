import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { Header } from "@/components/shared/header"
import { BottomNav } from "@/components/shared/bottom-nav"

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
  icons: {
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
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
        <div className="mx-auto w-full max-w-screen-xl min-h-screen flex flex-col">
          <Header />
          
          <main className="flex-1 pt-4 pb-24 md:pb-10 px-4 md:px-6">
            {children}
          </main>

          <BottomNav />
        </div>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

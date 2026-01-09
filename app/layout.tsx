import type { Metadata, Viewport } from "next"
import { DM_Sans } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { ConditionalLayout } from "@/components/shared/conditional-layout"
import { AuthListener } from "@/components/auth/auth-listener"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "MOVE - Your Premium Travel Companion",
  description: "Planifică vacanța perfectă cu MOVE. Itinerarii personalizate și experiențe de neuitat.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MOVE",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  themeColor: "#003CFF", // MOVE blue
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={dmSans.variable} suppressHydrationWarning>
      <body className="antialiased relative min-h-screen">
        <AuthListener />
        {/* Faded Background Pattern */}
        <div
          className="fixed inset-0 z-[-1] opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "url('/images/travel-pattern.svg')",
            backgroundRepeat: "repeat",
            backgroundSize: "400px" // Adjust size as needed for a nice pattern
          }}
        />

        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

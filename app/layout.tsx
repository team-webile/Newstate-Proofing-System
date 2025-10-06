import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Footer from "@/components/footer"
import { LogoProvider } from "@/contexts/LogoContext"
import { SocketProvider } from "@/contexts/SocketContext"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Newstate Branding Co. - Proofing System",
  description: "Client proofing and approval system",
  generator: 'v0.app',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="bg-neutral-950 text-white min-h-screen flex flex-col">
        <LogoProvider>
          <SocketProvider>
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </SocketProvider>
        </LogoProvider>
      </body>
    </html>
  )
}

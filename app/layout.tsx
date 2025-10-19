import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
// import { Toaster } from "@/components/ui/sonner"
import { RealtimeProvider } from "@/components/realtime-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Scuttle - Audio Library Manager",
  description: "Self-hosted web-based audio archival and streaming tool",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <RealtimeProvider>{children}</RealtimeProvider>
        {/* <Toaster /> */}
        <Analytics />
      </body>
    </html>
  )
}

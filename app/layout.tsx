import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LinksProvider } from "@/hooks/use-links"
import { Analytics } from '@vercel/analytics/next';
import "@/lib/google-auth"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Link Dashboard",
  description: "Link shortening and tracking dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#090909]`}>
        <LinksProvider>
          {children}
          <Analytics />
        </LinksProvider>
      </body>
    </html>
  )
}

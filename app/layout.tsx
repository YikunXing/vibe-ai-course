import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LinksProvider } from "@/hooks/use-links"
import { Analytics } from '@vercel/analytics/next';
import "@/lib/google-auth"
import Script from "next/script"

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
      <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-RM7619BEJV" strategy="afterInteractive"></Script>
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments)}
            gtag('js', new Date());
            gtag('config', 'G-RM7619BEJV');
          `}
        </Script>
      </head>
      <body className={`${inter.className} bg-[#090909]`}>
        <LinksProvider>
          {children}
          <Analytics />
        </LinksProvider>
      </body>
    </html>
  )
}

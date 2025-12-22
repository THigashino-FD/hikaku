import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "NEUTRAL COMPARE - FREEDOM ARCHITECTS",
  description:
    "設計レビュー向けのBefore/After比較ツール。スライダーで差分を確認し、拡大・位置合わせでディテールも精査できます。",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${geist.className} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}

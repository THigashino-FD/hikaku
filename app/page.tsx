import type { Metadata } from "next"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ToolDescription } from "@/components/layout/tool-description"
import { CasesSection } from "@/components/cases-section"

export const metadata: Metadata = {
  title: "劇的ビフォー/アフターツール - NEUTRAL COMPARE",
  description: "設計レビューおよび施主様への確認用ツール。スライダーによる直感的な比較、およびディテール確認のための拡大・位置調整が可能です。",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <ToolDescription />
      <CasesSection />
      <Footer />
    </main>
  )
}


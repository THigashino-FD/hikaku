import type { Metadata } from "next"
import { Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ToolDescription } from "@/components/layout/tool-description"
import { CasesSection } from "@/components/cases-section"

export const metadata: Metadata = {
  title: "劇的ビフォー/アフターツール - NEUTRAL COMPARE",
  description: "設計レビューおよび施主様への確認用ツール。スライダーによる直感的な比較、およびディテール確認のための拡大・位置調整が可能です。",
}

// cacheComponentsが有効な場合、PPRは自動的に有効化されます
// 静的コンテンツ（Header, Footer, ToolDescription）はビルド時に生成し、
// 動的コンテンツ（CasesSection）はストリーミングで配信

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <ToolDescription />
      {/* 動的コンテンツをSuspenseでラップしてストリーミング */}
      <Suspense fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-medium">読み込み中...</div>
            <div className="mt-2 text-sm text-muted-foreground">コンテンツを準備しています</div>
          </div>
        </div>
      }>
        <CasesSection />
      </Suspense>
      <Footer />
    </main>
  )
}


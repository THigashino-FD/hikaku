import type { Metadata } from "next"
import { Suspense } from "react"
import { CachedHeader } from "@/components/layout/cached-header"
import { CachedFooter } from "@/components/layout/cached-footer"
import { CachedToolDescription } from "@/components/layout/cached-tool-description"
import { CasesSection } from "@/components/cases-section"
import { Loading } from "@/components/ui/loading"

export const metadata: Metadata = {
  title: "劇的ビフォー/アフターツール - NEUTRAL COMPARE",
  description: "設計レビューおよび施主様への確認用ツール。スライダーによる直感的な比較、およびディテール確認のための拡大・位置調整が可能です。",
}

// Cache Components ("use cache") を使用したPPRパターン実装
// 静的コンテンツ（Header, Footer, ToolDescription）は "use cache" でキャッシュされ、
// 動的コンテンツ（CasesSection）はSuspenseでストリーミング配信される

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <CachedHeader />
      <CachedToolDescription />
      {/* 動的コンテンツをSuspenseでラップしてストリーミング */}
      <Suspense fallback={<Loading message="コンテンツを準備しています" />}>
        <CasesSection />
      </Suspense>
      <CachedFooter />
    </main>
  )
}


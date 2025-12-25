import type { Metadata } from "next"
import { decodeSharedCase } from "@/lib/share"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CasesSection } from "@/components/cases-section"

type Props = {
  params: Promise<{ encoded: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { encoded } = await params
  const shareData = decodeSharedCase(encoded)

  if (!shareData) {
    return {
      title: "劇的ビフォー/アフターツール - NEUTRAL COMPARE",
      description: "設計レビューおよび施主様への確認用ツール。",
    }
  }

  const title = shareData.title || "Before/After比較"
  const description = shareData.description || "スライダーによる直感的な比較が可能です。"
  const ogImageUrl = `/api/og?share=${encodeURIComponent(encoded)}`

  return {
    title: `${title} - NEUTRAL COMPARE`,
    description,
    openGraph: {
      title: `${title} - NEUTRAL COMPARE`,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - NEUTRAL COMPARE`,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { encoded } = await params
  const shareData = decodeSharedCase(encoded)
  
  if (!shareData) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-10">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-base font-semibold text-foreground">共有リンクの解析に失敗しました</h2>
            <p className="mt-2 text-sm text-destructive">
              URLが正しいか確認してください。
            </p>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  // クライアントサイドで共有データを処理するため、ハッシュに設定
  const shareHash = `#share=${encoded}`

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10 md:px-10 overflow-x-hidden">
        <CasesSection shareHash={shareHash} />
      </div>
      <Footer />
    </main>
  )
}


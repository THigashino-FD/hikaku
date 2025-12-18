import { BeforeAfterSlider } from "@/components/before-after-slider"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-balance text-foreground">画像比較ツール</h1>
          <p className="text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            スライダーをドラッグして、Before/After画像を簡単に比較できます
          </p>
        </header>

        {/* Main Comparison Slider */}
        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">建物の改築 - ビフォー/アフター</h2>
            <p className="text-muted-foreground">スライダーを左右にドラッグして建物の変化を確認してください</p>
          </div>
          <BeforeAfterSlider
            beforeImage="/before-house.png"
            afterImage="/after-house.jpg"
            beforeLabel="改築前"
            afterLabel="改築後"
            className="w-full shadow-2xl"
            defaultBeforeScale={120}
            defaultBeforeX={0}
            defaultBeforeY={0}
            defaultAfterScale={100}
            defaultAfterX={0}
            defaultAfterY={0}
          />
        </section>

        {/* Additional Examples */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">例 1: 別角度からの改築</h3>
            <BeforeAfterSlider
              beforeImage="/before-house-2.png"
              afterImage="/after-house-2.jpg"
              beforeLabel="改築前"
              afterLabel="改築後"
              className="shadow-lg"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">例 2: 松戸市の住宅改築</h3>
            <BeforeAfterSlider
              beforeImage="/before-house-3.png"
              afterImage="/after-house-3.png"
              beforeLabel="改築前"
              afterLabel="改築後"
              className="shadow-lg"
              defaultBeforeScale={125}
              defaultBeforeX={-15}
              defaultBeforeY={6}
              defaultAfterScale={100}
              defaultAfterX={0}
              defaultAfterY={0}
            />
          </div>
        </section>

        {/* Features */}
        <section className="space-y-6 pt-8">
          <h2 className="text-2xl font-semibold text-center text-foreground">機能</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">直感的な操作</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                スライダーをドラッグするだけで簡単に画像を比較できます
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">レスポンシブ対応</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                デスクトップ、タブレット、スマートフォンで最適な表示
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-card p-6 text-card-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">高速パフォーマンス</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                スムーズでラグのない滑らかなスライダー操作
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>画像比較ツール - Before/Afterを視覚的に比較</p>
        </footer>
      </div>
    </main>
  )
}

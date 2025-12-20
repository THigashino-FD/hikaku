"use client"

import { useState, useEffect } from "react"
import { BeforeAfterSlider } from "@/components/before-after-slider"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import {
  getAllCases,
  getImageById,
  updateCase,
  CaseRecord,
  createObjectURL,
  revokeObjectURL,
} from "@/lib/db"
import { initializeApp } from "@/lib/init"

export default function Home() {
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadCases = async () => {
    setIsLoading(true)
    try {
      // 初回起動時にデフォルトCASEをセットアップ
      await initializeApp()
      
      const casesData = await getAllCases()
      setCases(casesData)
    } catch (error) {
      console.error("Failed to load cases:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [])

  const handleSaveViewSettings = async (
    caseId: string,
    beforeSettings: { scale: number; x: number; y: number },
    afterSettings: { scale: number; x: number; y: number }
  ) => {
    const caseRecord = cases.find((c) => c.id === caseId)
    if (!caseRecord) return

    const updatedCase: CaseRecord = {
      ...caseRecord,
      view: {
        before: beforeSettings,
        after: afterSettings,
      },
    }

    try {
      await updateCase(updatedCase)
      await loadCases()
    } catch (error) {
      console.error("Failed to save view settings:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Top bar - Dark Teal Background per LP reference */}
      <header className="sticky top-0 z-40 bg-primary py-4 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10">
              <Image
                src="/freedom-logo-mark-teal-on-white.png"
                alt="FREEDOM Logo Mark"
                width={40}
                height={40}
                priority
              />
            </div>
            <div className="h-6">
              <Image 
                src="/freedom-architects-wordmark-black.png"
                alt="FREEDOM ARCHITECTS" 
                width={180} 
                height={22} 
                priority 
                className="brightness-0 invert"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-[10px] font-bold tracking-[0.2em] text-primary-foreground/60 md:block">
              RENOVATION REVIEW TOOL
            </div>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/manage">管理ページ</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-12 px-6 py-10 md:px-10">
        {/* Tool Description */}
        <section className="border-l-4 border-primary pl-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            改築ビフォー/アフター比較
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
            設計レビューおよび施主様への確認用ツールです。
            スライダーによる直感的な比較、およびディテール確認のための拡大・位置調整が可能です。
          </p>
        </section>

        {/* Cases */}
        {cases.length === 0 ? (
          <section className="rounded-xl border-2 border-dashed border-border p-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              CASEがありません
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              管理ページからCASEと画像を追加してください
            </p>
            <Button className="mt-4" asChild>
              <Link href="/manage">管理ページへ</Link>
            </Button>
          </section>
        ) : (
          <div className="space-y-12">
            {cases.map((caseRecord, index) => (
              <CaseViewer
                key={caseRecord.id}
                caseRecord={caseRecord}
                isFirst={index === 0}
                onSaveViewSettings={handleSaveViewSettings}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer - Following lp_z style */}
      <footer className="mt-20 bg-[#0b5560] py-14 text-white">
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16">
                <Image
                  src="/freedom-logo-mark-white-on-teal.png"
                  alt="FREEDOM Logo Mark"
                  width={64}
                  height={64}
                  priority
                />
              </div>
            </div>
            <div className="text-[10px] tracking-[0.12em] text-white/70">
              COPYRIGHT ©FREEDOM ARCHITECTS ALL RIGHTS RESERVED.
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

interface CaseViewerProps {
  caseRecord: CaseRecord
  isFirst: boolean
  onSaveViewSettings: (
    caseId: string,
    beforeSettings: { scale: number; x: number; y: number },
    afterSettings: { scale: number; x: number; y: number }
  ) => void
}

function CaseViewer({ caseRecord, isFirst, onSaveViewSettings }: CaseViewerProps) {
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>("")
  const [afterImageUrl, setAfterImageUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true)
      try {
        if (caseRecord.beforeImageId) {
          const image = await getImageById(caseRecord.beforeImageId)
          if (image) {
            const url = createObjectURL(image.blob)
            setBeforeImageUrl(url)
          }
        }
        if (caseRecord.afterImageId) {
          const image = await getImageById(caseRecord.afterImageId)
          if (image) {
            const url = createObjectURL(image.blob)
            setAfterImageUrl(url)
          }
        }
      } catch (error) {
        console.error("Failed to load images:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()

    return () => {
      if (beforeImageUrl) revokeObjectURL(beforeImageUrl)
      if (afterImageUrl) revokeObjectURL(afterImageUrl)
    }
  }, [caseRecord.beforeImageId, caseRecord.afterImageId])

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className={isFirst ? "text-sm font-bold tracking-widest text-muted-foreground" : "text-xs font-bold tracking-widest text-muted-foreground"}>
            {caseRecord.title}
          </h2>
        </div>
        <div className="flex h-96 items-center justify-center rounded-xl border bg-muted">
          <div className="text-sm text-muted-foreground">読み込み中...</div>
        </div>
      </section>
    )
  }

  if (!beforeImageUrl || !afterImageUrl) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className={isFirst ? "text-sm font-bold tracking-widest text-muted-foreground" : "text-xs font-bold tracking-widest text-muted-foreground"}>
            {caseRecord.title}
          </h2>
        </div>
        <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/30">
          <div className="text-sm font-medium text-muted-foreground">
            画像が設定されていません
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/manage">管理ページで設定</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div>
          <h2 className={isFirst ? "text-sm font-bold tracking-widest text-muted-foreground" : "text-xs font-bold tracking-widest text-muted-foreground"}>
            {caseRecord.title}
          </h2>
          {caseRecord.description && (
            <p className="mt-1 text-sm text-muted-foreground">{caseRecord.description}</p>
          )}
        </div>
      </div>
      <BeforeAfterSlider
        beforeImage={beforeImageUrl}
        afterImage={afterImageUrl}
        beforeLabel="既存（Before）"
        afterLabel="改修案（After）"
        className={isFirst ? "w-full border border-border bg-white shadow-xl" : "border border-border bg-white shadow-lg"}
        defaultBeforeScale={caseRecord.view.before.scale}
        defaultBeforeX={caseRecord.view.before.x}
        defaultBeforeY={caseRecord.view.before.y}
        defaultAfterScale={caseRecord.view.after.scale}
        defaultAfterX={caseRecord.view.after.x}
        defaultAfterY={caseRecord.view.after.y}
        initialSliderPosition={caseRecord.initialSliderPosition}
        animationType={caseRecord.animationType}
        onSaveViewSettings={(beforeSettings, afterSettings) =>
          onSaveViewSettings(caseRecord.id, beforeSettings, afterSettings)
        }
      />
    </section>
  )
}

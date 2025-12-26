"use client"

import type { ImageRecordWithBlob } from "@/lib/db"

interface StatisticsSectionProps {
  casesCount: number
  imagesCount: number
  shareableCount: number
  images: ImageRecordWithBlob[]
}

export function StatisticsSection({ casesCount, imagesCount, shareableCount, images }: StatisticsSectionProps) {
  const urlImagesCount = images.filter((img) => img.sourceUrl).length

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">CASE総数</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{casesCount}</p>
      </div>
      <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">画像総数</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{imagesCount}</p>
      </div>
      <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">共有可能CASE</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{shareableCount}</p>
      </div>
      <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
        <p className="text-xs text-muted-foreground">URL画像</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{urlImagesCount}</p>
      </div>
    </section>
  )
}


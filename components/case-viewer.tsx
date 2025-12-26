"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BeforeAfterSlider } from "@/components/before-after-slider"
import {
  getImageById,
  createObjectURL,
  revokeObjectURL,
  CaseRecord,
} from "@/lib/db"
import { logger } from "@/lib/logger"

interface CaseViewerProps {
  caseRecord: CaseRecord
  isFirst: boolean
  onSaveViewSettings: (
    caseId: string,
    beforeSettings: { scale: number; x: number; y: number },
    afterSettings: { scale: number; x: number; y: number }
  ) => void
}

export function CaseViewer({ caseRecord, isFirst, onSaveViewSettings }: CaseViewerProps) {
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>("")
  const [afterImageUrl, setAfterImageUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState<{ before: boolean; after: boolean }>({ before: false, after: false })
  const [retryKey, setRetryKey] = useState(0) // 再読み込み用のキー
  const beforeUrlRef = useRef<string>("")
  const afterUrlRef = useRef<string>("")

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true)
      setImageError({ before: false, after: false })
      try {
        if (caseRecord.beforeImageId) {
          const image = await getImageById(caseRecord.beforeImageId)
          if (image) {
            const url = createObjectURL(image.blob)
            if (beforeUrlRef.current) revokeObjectURL(beforeUrlRef.current)
            beforeUrlRef.current = url
            setBeforeImageUrl(url)
          }
        } else {
          if (beforeUrlRef.current) revokeObjectURL(beforeUrlRef.current)
          beforeUrlRef.current = ""
          setBeforeImageUrl("")
        }
        if (caseRecord.afterImageId) {
          const image = await getImageById(caseRecord.afterImageId)
          if (image) {
            const url = createObjectURL(image.blob)
            if (afterUrlRef.current) revokeObjectURL(afterUrlRef.current)
            afterUrlRef.current = url
            setAfterImageUrl(url)
          }
        } else {
          if (afterUrlRef.current) revokeObjectURL(afterUrlRef.current)
          afterUrlRef.current = ""
          setAfterImageUrl("")
        }
      } catch (error) {
        logger.error("Failed to load images:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()

    return () => {
      if (beforeUrlRef.current) revokeObjectURL(beforeUrlRef.current)
      if (afterUrlRef.current) revokeObjectURL(afterUrlRef.current)
      beforeUrlRef.current = ""
      afterUrlRef.current = ""
    }
  }, [caseRecord.beforeImageId, caseRecord.afterImageId, retryKey])

  const handleImageError = (side: 'before' | 'after') => {
    setImageError(prev => ({ ...prev, [side]: true }))
  }

  const handleRetry = () => {
    // URLを再生成して再読み込みを試みる
    if (beforeUrlRef.current) {
      revokeObjectURL(beforeUrlRef.current)
      beforeUrlRef.current = ""
    }
    if (afterUrlRef.current) {
      revokeObjectURL(afterUrlRef.current)
      afterUrlRef.current = ""
    }
    setBeforeImageUrl("")
    setAfterImageUrl("")
    setImageError({ before: false, after: false })
    setRetryKey(prev => prev + 1)
  }

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
    const hasError = imageError.before || imageError.after
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className={isFirst ? "text-sm font-bold tracking-widest text-muted-foreground" : "text-xs font-bold tracking-widest text-muted-foreground"}>
            {caseRecord.title}
          </h2>
        </div>
        <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border bg-muted/30">
          {hasError ? (
            <>
              <div className="text-sm font-medium text-destructive">
                画像の読み込みに失敗しました
              </div>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                再読み込み
              </Button>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-muted-foreground">
                画像が設定されていません
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/manage">管理ページで設定</Link>
              </Button>
            </>
          )}
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
      {(imageError.before || imageError.after) && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                画像の読み込みに失敗しました
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {imageError.before && imageError.after
                  ? "Before/After両方の画像"
                  : imageError.before
                  ? "Before画像"
                  : "After画像"}
                の読み込みに失敗しました。再読み込みを試してください。
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              再読み込み
            </Button>
          </div>
        </div>
      )}
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
        onImageError={handleImageError}
      />
    </section>
  )
}


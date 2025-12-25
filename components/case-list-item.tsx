"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  CaseRecord,
  getImageById,
  createObjectURL,
  revokeObjectURL,
} from "@/lib/db"

interface CaseListItemProps {
  caseRecord: CaseRecord
  index: number
  totalCount: number
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onShare: () => void
  isShareable?: boolean // 共有可能かどうか
}

export function CaseListItem({
  caseRecord,
  index,
  totalCount,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onShare,
  isShareable = false,
}: CaseListItemProps) {
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>("")
  const [afterImageUrl, setAfterImageUrl] = useState<string>("")
  const [beforeLoaded, setBeforeLoaded] = useState(false)
  const [afterLoaded, setAfterLoaded] = useState(false)
  const beforeUrlRef = useRef<string>("")
  const afterUrlRef = useRef<string>("")

  useEffect(() => {
    const loadImages = async () => {
      if (caseRecord.beforeImageId) {
        const image = await getImageById(caseRecord.beforeImageId)
        if (image) {
          const url = createObjectURL(image.blob)
          if (beforeUrlRef.current) revokeObjectURL(beforeUrlRef.current)
          beforeUrlRef.current = url
          setBeforeLoaded(false)
          setBeforeImageUrl(url)
        }
      } else {
        if (beforeUrlRef.current) revokeObjectURL(beforeUrlRef.current)
        beforeUrlRef.current = ""
        setBeforeLoaded(false)
        setBeforeImageUrl("")
      }
      if (caseRecord.afterImageId) {
        const image = await getImageById(caseRecord.afterImageId)
        if (image) {
          const url = createObjectURL(image.blob)
          if (afterUrlRef.current) revokeObjectURL(afterUrlRef.current)
          afterUrlRef.current = url
          setAfterLoaded(false)
          setAfterImageUrl(url)
        }
      } else {
        if (afterUrlRef.current) revokeObjectURL(afterUrlRef.current)
        afterUrlRef.current = ""
        setAfterLoaded(false)
        setAfterImageUrl("")
      }
    }

    loadImages()

    return () => {
      if (beforeUrlRef.current) revokeObjectURL(beforeUrlRef.current)
      if (afterUrlRef.current) revokeObjectURL(afterUrlRef.current)
      beforeUrlRef.current = ""
      afterUrlRef.current = ""
    }
  }, [caseRecord.beforeImageId, caseRecord.afterImageId])

  return (
    <div 
      className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4"
      data-testid="manage-case-card"
      data-case-id={caseRecord.id}
      data-case-title={caseRecord.title}
    >
      {/* Order Controls - hidden on mobile */}
      <div className="hidden sm:flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveUp}
          disabled={index === 0}
          className="h-6 w-6 p-0"
          data-testid="manage-case-move-up"
          aria-label="上へ移動"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveDown}
          disabled={index === totalCount - 1}
          className="h-6 w-6 p-0"
          data-testid="manage-case-move-down"
          aria-label="下へ移動"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </div>

      {/* Thumbnails and Info container */}
      <div className="flex gap-3 flex-1 min-w-0">
        {/* Thumbnails */}
        <div className="flex gap-2 flex-shrink-0">
          <div className="relative h-16 w-24 overflow-hidden rounded border bg-muted">
            {beforeImageUrl ? (
              <>
                {!beforeLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                    <svg className="h-6 w-6 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <Image 
                  src={beforeImageUrl} 
                  alt="Before" 
                  fill
                  className="object-cover"
                  onLoad={() => setBeforeLoaded(true)}
                  sizes="96px"
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Before
              </div>
            )}
          </div>
          <div className="relative h-16 w-24 overflow-hidden rounded border bg-muted">
            {afterImageUrl ? (
              <>
                {!afterLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                    <svg className="h-6 w-6 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <Image 
                  src={afterImageUrl} 
                  alt="After" 
                  fill
                  className="object-cover"
                  onLoad={() => setAfterLoaded(true)}
                  sizes="96px"
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                After
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold truncate">{caseRecord.title}</div>
            {/* 共有可能バッジ */}
            {isShareable ? (
              <span className="inline-flex items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 flex-shrink-0">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                共有可
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 flex-shrink-0">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
                共有不可
              </span>
            )}
          </div>
          {caseRecord.description && (
            <div className="text-sm text-muted-foreground truncate">{caseRecord.description}</div>
          )}
        </div>
      </div>

      {/* Actions - responsive layout */}
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onShare} 
          className="gap-1 flex-1 sm:flex-none"
          data-testid="manage-case-share"
          aria-label="共有"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span className="sm:inline">共有</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEdit} 
          className="flex-1 sm:flex-none"
          data-testid="manage-case-edit"
          aria-label="編集"
        >
          編集
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDuplicate} 
          className="flex-1 sm:flex-none"
          data-testid="manage-case-duplicate"
          aria-label="複製"
        >
          複製
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDelete} 
          className="text-destructive flex-1 sm:flex-none"
          data-testid="manage-case-delete"
          aria-label="削除"
        >
          削除
        </Button>
      </div>
    </div>
  )
}


"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { type CaseRecord, type ImageRecordWithBlob } from "@/lib/db"
import { loadManageData } from "@/lib/data-loader"
import { CaseListItem } from "@/components/case-list-item"
import { useToast } from "@/components/ui/toast"
import { logger } from "@/lib/logger"
import { useCaseManagement } from "./hooks/use-case-management"
import { useCaseSharing } from "./hooks/use-case-sharing"
import { ShareDialog } from "./share-dialog"
import { StatisticsSection } from "./statistics-section"
import { EmptyState } from "./empty-state"

// モーダルコンポーネントを動的インポート（初期バンドルサイズ削減）
const ImageLibrary = dynamic(() => import("@/components/image-library").then(mod => ({ default: mod.ImageLibrary })), {
  loading: () => <div className="flex items-center justify-center p-8">読み込み中...</div>,
})
const CaseEditor = dynamic(() => import("@/components/case-editor").then(mod => ({ default: mod.CaseEditor })), {
  loading: () => <div className="flex items-center justify-center p-8">読み込み中...</div>,
})

export function ManageContent() {
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [images, setImages] = useState<ImageRecordWithBlob[]>([])
  const [editingCase, setEditingCase] = useState<CaseRecord | null>(null)
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [shareableStatus, setShareableStatus] = useState<Record<string, boolean>>({})
  const { showToast } = useToast()

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await loadManageData()
      setCases(data.cases)
      setImages(data.images)
      setShareableStatus(data.shareableStatus)
    } catch (error) {
      logger.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const {
    handleAddCase,
    handleSaveCase,
    handleDeleteCase,
    handleDuplicateCase,
    handleMoveUp,
    handleMoveDown,
  } = useCaseManagement({ cases, showToast, loadData })

  const {
    sharingCase,
    shareLink,
    shareError,
    handleShare,
    copyShareLink,
    closeShareDialog,
    setSharingCase,
    setShareLink,
    setShareError,
  } = useCaseSharing({ showToast })

  const handleEditCase = useCallback((caseRecord: CaseRecord) => {
    setEditingCase(caseRecord)
  }, [])

  const handleSaveCaseWrapper = useCallback(async (caseRecord: CaseRecord) => {
    await handleSaveCase(caseRecord)
    setEditingCase(null)
  }, [handleSaveCase])

  const handleOpenImageLibraryFromShare = useCallback(() => {
    setSharingCase(null)
    setShareLink("")
    setShareError("")
    setShowImageLibrary(true)
  }, [setSharingCase, setShareLink, setShareError])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">読み込み中...</div>
        </div>
      </div>
    )
  }

  if (editingCase) {
    return (
      <CaseEditor
        caseRecord={editingCase}
        images={images}
        onSave={handleSaveCaseWrapper}
        onCancel={() => setEditingCase(null)}
      />
    )
  }

  if (showImageLibrary) {
    return (
      <ImageLibrary
        onClose={() => {
          setShowImageLibrary(false)
          loadData()
        }}
      />
    )
  }

  if (sharingCase) {
    return (
      <ShareDialog
        sharingCase={sharingCase}
        shareLink={shareLink}
        shareError={shareError}
        onClose={closeShareDialog}
        onCopyShareLink={copyShareLink}
        onOpenImageLibrary={handleOpenImageLibraryFromShare}
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 md:px-10">
      {/* Statistics */}
      <StatisticsSection
        casesCount={cases.length}
        imagesCount={images.length}
        shareableCount={Object.values(shareableStatus).filter(Boolean).length}
        images={images}
      />

      {/* Quick Actions */}
      <section className="flex flex-wrap gap-3">
        <Button onClick={handleAddCase} size="lg" className="gap-2 font-semibold">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規CASE追加
        </Button>
        <Button
          onClick={() => setShowImageLibrary(true)}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          画像ライブラリを編集 ({images.length})
        </Button>
      </section>

      {/* Cases List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">CASE一覧</h2>
        
        {cases.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {cases.map((caseRecord, index) => (
              <CaseListItem
                key={caseRecord.id}
                caseRecord={caseRecord}
                index={index}
                totalCount={cases.length}
                onEdit={() => handleEditCase(caseRecord)}
                onDelete={() => handleDeleteCase(caseRecord.id)}
                onDuplicate={() => handleDuplicateCase(caseRecord)}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
                onShare={() => handleShare(caseRecord)}
                isShareable={shareableStatus[caseRecord.id] || false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}


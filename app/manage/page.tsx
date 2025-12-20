"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  getAllCases, 
  addCase, 
  updateCase, 
  deleteCase, 
  reorderCases,
  CaseRecord,
  getAllImages,
  ImageRecord,
  getImageById,
  createObjectURL,
  revokeObjectURL,
} from "@/lib/db"
import { initializeApp } from "@/lib/init"
import { ImageLibrary } from "@/components/image-library"
import { CaseEditor } from "@/components/case-editor"
import Link from "next/link"
import { v4 as uuidv4 } from "uuid"

export default function ManagePage() {
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [images, setImages] = useState<ImageRecord[]>([])
  const [editingCase, setEditingCase] = useState<CaseRecord | null>(null)
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    setIsLoading(true)
    try {
      // 初回起動時にデフォルトCASEをセットアップ
      await initializeApp()
      
      const [casesData, imagesData] = await Promise.all([
        getAllCases(),
        getAllImages(),
      ])
      setCases(casesData)
      setImages(imagesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddCase = async () => {
    const newCase: CaseRecord = {
      id: uuidv4(),
      title: `CASE ${cases.length + 1}`,
      description: "",
      order: cases.length,
      view: {
        before: { scale: 100, x: 0, y: 0 },
        after: { scale: 100, x: 0, y: 0 },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    try {
      await addCase(newCase)
      await loadData()
    } catch (error) {
      console.error("Failed to add case:", error)
      alert("CASEの追加に失敗しました")
    }
  }

  const handleEditCase = (caseRecord: CaseRecord) => {
    setEditingCase(caseRecord)
  }

  const handleSaveCase = async (caseRecord: CaseRecord) => {
    try {
      await updateCase(caseRecord)
      await loadData()
      setEditingCase(null)
    } catch (error) {
      console.error("Failed to update case:", error)
      alert("CASEの更新に失敗しました")
    }
  }

  const handleDeleteCase = async (id: string) => {
    if (!confirm("このCASEを削除してもよろしいですか？")) {
      return
    }

    try {
      await deleteCase(id)
      await loadData()
    } catch (error) {
      console.error("Failed to delete case:", error)
      alert("CASEの削除に失敗しました")
    }
  }

  const handleDuplicateCase = async (caseRecord: CaseRecord) => {
    const duplicated: CaseRecord = {
      ...caseRecord,
      id: uuidv4(),
      title: `${caseRecord.title} (コピー)`,
      order: cases.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    try {
      await addCase(duplicated)
      await loadData()
    } catch (error) {
      console.error("Failed to duplicate case:", error)
      alert("CASEの複製に失敗しました")
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    
    const newCases = [...cases]
    const temp = newCases[index]
    newCases[index] = newCases[index - 1]
    newCases[index - 1] = temp

    try {
      await reorderCases(newCases.map((c) => c.id))
      await loadData()
    } catch (error) {
      console.error("Failed to reorder cases:", error)
      alert("並び替えに失敗しました")
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === cases.length - 1) return

    const newCases = [...cases]
    const temp = newCases[index]
    newCases[index] = newCases[index + 1]
    newCases[index + 1] = temp

    try {
      await reorderCases(newCases.map((c) => c.id))
      await loadData()
    } catch (error) {
      console.error("Failed to reorder cases:", error)
      alert("並び替えに失敗しました")
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

  if (editingCase) {
    return (
      <CaseEditor
        caseRecord={editingCase}
        images={images}
        onSave={handleSaveCase}
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

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">管理ページ</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/">閲覧ページへ</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 md:px-10">
        {/* Quick Actions */}
        <section className="flex flex-wrap gap-3">
          <Button onClick={handleAddCase} className="gap-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新規CASE追加
          </Button>
          <Button
            onClick={() => setShowImageLibrary(true)}
            variant="outline"
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
            画像ライブラリ ({images.length})
          </Button>
        </section>

        {/* Cases List */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">CASE一覧</h2>
          
          {cases.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                CASEがありません。「新規CASE追加」ボタンから作成してください。
              </p>
            </div>
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
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

interface CaseListItemProps {
  caseRecord: CaseRecord
  index: number
  totalCount: number
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function CaseListItem({
  caseRecord,
  index,
  totalCount,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}: CaseListItemProps) {
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>("")
  const [afterImageUrl, setAfterImageUrl] = useState<string>("")

  useEffect(() => {
    const loadImages = async () => {
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
    }

    loadImages()

    return () => {
      if (beforeImageUrl) revokeObjectURL(beforeImageUrl)
      if (afterImageUrl) revokeObjectURL(afterImageUrl)
    }
  }, [caseRecord.beforeImageId, caseRecord.afterImageId])

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
      {/* Order Controls */}
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveUp}
          disabled={index === 0}
          className="h-6 w-6 p-0"
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
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2">
        <div className="h-16 w-24 overflow-hidden rounded border bg-muted">
          {beforeImageUrl ? (
            <img src={beforeImageUrl} alt="Before" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Before
            </div>
          )}
        </div>
        <div className="h-16 w-24 overflow-hidden rounded border bg-muted">
          {afterImageUrl ? (
            <img src={afterImageUrl} alt="After" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              After
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="font-semibold">{caseRecord.title}</div>
        {caseRecord.description && (
          <div className="text-sm text-muted-foreground">{caseRecord.description}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          編集
        </Button>
        <Button variant="outline" size="sm" onClick={onDuplicate}>
          複製
        </Button>
        <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive">
          削除
        </Button>
      </div>
    </div>
  )
}


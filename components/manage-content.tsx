"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { 
  addCase, 
  updateCase, 
  deleteCase, 
  reorderCases,
  CaseRecord,
  ImageRecordWithBlob,
  getImageById,
} from "@/lib/db"
import { loadManageData } from "@/lib/data-loader"
import { CaseListItem } from "@/components/case-list-item"
import { Input } from "@/components/ui/input"
import { v4 as uuidv4 } from "uuid"
import { generateShareUrl, type SharedCaseData } from "@/lib/share"
import { useToast } from "@/components/ui/toast"
import { logger } from "@/lib/logger"

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
  const [sharingCase, setSharingCase] = useState<CaseRecord | null>(null)
  const [shareLink, setShareLink] = useState<string>("")
  const [shareError, setShareError] = useState<string>("")
  const [shareableStatus, setShareableStatus] = useState<Record<string, boolean>>({})
  const { showToast } = useToast()

  const loadData = async () => {
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
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddCase = useCallback(async () => {
    const newCase: CaseRecord = {
      id: uuidv4(),
      title: `CASE ${cases.length + 1}`,
      description: "",
      order: cases.length,
      view: {
        before: { scale: 100, x: 0, y: 0 },
        after: { scale: 100, x: 0, y: 0 },
      },
      initialSliderPosition: 50,
      animationType: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    try {
      await addCase(newCase)
      await loadData()
    } catch (error) {
      logger.error("Failed to add case:", error)
      showToast("CASEの追加に失敗しました", "error")
    }
  }, [cases.length, showToast])

  const handleEditCase = useCallback((caseRecord: CaseRecord) => {
    setEditingCase(caseRecord)
  }, [])

  const handleSaveCase = useCallback(async (caseRecord: CaseRecord) => {
    try {
      await updateCase(caseRecord)
      await loadData()
      setEditingCase(null)
    } catch (error) {
      logger.error("Failed to update case:", error)
      showToast("CASEの更新に失敗しました", "error")
    }
  }, [showToast])

  const handleDeleteCase = useCallback(async (id: string) => {
    if (!confirm("このCASEを削除してもよろしいですか？")) {
      return
    }

    try {
      await deleteCase(id)
      await loadData()
    } catch (error) {
      logger.error("Failed to delete case:", error)
      showToast("CASEの削除に失敗しました", "error")
    }
  }, [showToast])

  const handleDuplicateCase = useCallback(async (caseRecord: CaseRecord) => {
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
      logger.error("Failed to duplicate case:", error)
      showToast("CASEの複製に失敗しました", "error")
    }
  }, [cases.length, showToast])

  const handleMoveUp = useCallback(async (index: number) => {
    if (index === 0) return
    
    const newCases = [...cases]
    const temp = newCases[index]
    newCases[index] = newCases[index - 1]
    newCases[index - 1] = temp

    try {
      await reorderCases(newCases.map((c) => c.id))
      await loadData()
    } catch (error) {
      logger.error("Failed to reorder cases:", error)
      showToast("並び替えに失敗しました", "error")
    }
  }, [cases, showToast])

  const handleMoveDown = useCallback(async (index: number) => {
    if (index === cases.length - 1) return

    const newCases = [...cases]
    const temp = newCases[index]
    newCases[index] = newCases[index + 1]
    newCases[index + 1] = temp

    try {
      await reorderCases(newCases.map((c) => c.id))
      await loadData()
    } catch (error) {
      logger.error("Failed to reorder cases:", error)
      showToast("並び替えに失敗しました", "error")
    }
  }, [cases, showToast])

  const handleShare = useCallback(async (caseRecord: CaseRecord) => {
    setShareError("")
    setShareLink("")
    
    try {
      const beforeImage = caseRecord.beforeImageId ? await getImageById(caseRecord.beforeImageId) : null
      const afterImage = caseRecord.afterImageId ? await getImageById(caseRecord.afterImageId) : null

      if (!beforeImage || !afterImage) {
        setShareError("Before/After画像が設定されていません")
        setSharingCase(caseRecord)
        return
      }

      if (!beforeImage.sourceUrl || !afterImage.sourceUrl) {
        setShareError("このCASEはURL画像ではないため共有できません。画像ライブラリから「URLから画像を追加」で画像を登録してください。")
        setSharingCase(caseRecord)
        return
      }

      const shareData: SharedCaseData = {
        title: caseRecord.title,
        description: caseRecord.description,
        beforeUrl: beforeImage.sourceUrl,
        afterUrl: afterImage.sourceUrl,
        initialSliderPosition: caseRecord.initialSliderPosition,
        animationType: caseRecord.animationType,
        view: {
          before: caseRecord.view.before,
          after: caseRecord.view.after,
        },
      }

      const url = generateShareUrl(shareData)
      setShareLink(url)
      setSharingCase(caseRecord)
    } catch (error) {
      logger.error("Failed to generate share link:", error)
      setShareError("共有リンクの生成に失敗しました")
      setSharingCase(caseRecord)
    }
  }, [])

  const copyShareLink = useCallback(async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      showToast("共有リンクをコピーしました", "success")
    } catch {
      showToast("コピーに失敗しました", "error")
    }
  }, [shareLink, showToast])

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

  if (sharingCase) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10 md:px-10">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b pb-4">
          <h1 className="text-xl font-bold">共有リンク生成</h1>
          <Button variant="outline" onClick={() => {
            setSharingCase(null)
            setShareLink("")
            setShareError("")
          }}>
            閉じる
          </Button>
        </div>
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold">{sharingCase.title}</h2>
            {sharingCase.description && (
              <p className="mb-4 text-sm text-muted-foreground">{sharingCase.description}</p>
            )}

            {shareError && (
              <div className="mb-4 space-y-3">
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                  {shareError}
                </div>

                {shareError.includes("URL画像ではない") && (
                  <div className="rounded-md bg-blue-50 p-5 text-sm">
                    <h4 className="mb-3 flex items-center gap-2 font-bold text-blue-900">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      なぜ「URLから追加した画像」が必要なのですか？
                    </h4>
                    <div className="mb-4 space-y-2 text-blue-800">
                      <p>
                        <strong>【パソコンから追加した画像】</strong><br />
                        パソコンから追加した画像は、<strong>あなたのブラウザの中だけ</strong>に保存されます。
                        他の人のパソコンには存在しないため、共有リンクを送っても相手は画像を見ることができません。
                      </p>
                      <p>
                        <strong>【URL画像】</strong><br />
                        Google DriveやオンラインストレージのURLから追加した画像は、<strong>インターネット上</strong>にあります。
                        共有リンクにそのURLを含めることで、リンクを開いた相手も同じ画像を見ることができます。
                      </p>
                    </div>

                    <h4 className="mb-2 font-semibold text-blue-900">共有できるCASEの作り方（手順）</h4>
                    <ol className="list-decimal space-y-2 pl-5 text-blue-800">
                      <li>
                        <strong>画像をGoogle Driveなどにアップロード</strong>して、共有設定を「リンクを知っている全員」に変更
                      </li>
                      <li>
                        <strong>画像ライブラリを編集</strong>ボタンをクリック
                      </li>
                      <li>
                        <strong>「URLから画像を追加」</strong>をクリックして、Before/After用の画像URLをそれぞれ追加
                      </li>
                      <li>
                        <strong>このCASEを編集</strong>して、Before/Afterに「URLから追加した画像」を割り当てて保存
                      </li>
                      <li>
                        <strong>再度「共有」ボタン</strong>をクリックすると、共有リンクが生成されます
                      </li>
                    </ol>

                    <div className="mt-4">
                      <Button
                        onClick={() => {
                          setSharingCase(null)
                          setShareLink("")
                          setShareError("")
                          setShowImageLibrary(true)
                        }}
                        className="w-full gap-2"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        画像ライブラリを開いてURLから画像を追加する
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {shareLink && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">共有リンク</label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={shareLink}
                      className="font-mono text-xs"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <Button onClick={copyShareLink}>
                      コピー
                    </Button>
                  </div>
                </div>

                <div className="rounded-md bg-muted/50 p-4 text-sm">
                  <h3 className="mb-2 font-semibold">共有方法</h3>
                  <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                    <li>上記のリンクをコピーして相手に送信</li>
                    <li>相手がリンクを開くと、同じ表示が再現されます</li>
                    <li>必要に応じて「共有CASEとして保存」ボタンで自分の環境に保存できます</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 md:px-10">
      {/* Statistics */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">CASE総数</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{cases.length}</p>
        </div>
        <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">画像総数</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{images.length}</p>
        </div>
        <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">共有可能CASE</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {Object.values(shareableStatus).filter(Boolean).length}
          </p>
        </div>
        <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
          <p className="text-xs text-muted-foreground">URL画像</p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {images.filter((img) => img.sourceUrl).length}
          </p>
        </div>
      </section>

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


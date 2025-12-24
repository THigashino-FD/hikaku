"use client"

import { useState, useEffect } from "react"
import { BeforeAfterSlider } from "@/components/before-after-slider"
import { CaseViewer } from "@/components/case-viewer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  getAllCases,
  addImage,
  addCase,
  updateCase,
  CaseRecord,
  ImageRecord,
} from "@/lib/db"
import { initializeApp } from "@/lib/init"
import { isWebKitBrowser, sleep } from "@/lib/browser"
import { getSharedCaseFromUrl, convertGoogleDriveUrl, type SharedCaseData } from "@/lib/share"
import { fetchAndResizeImage } from "@/lib/image-utils"
import { v4 as uuidv4 } from "uuid"

export function CasesSection() {
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sharedCase, setSharedCase] = useState<SharedCaseData | null>(null)
  const [shareError, setShareError] = useState<string>("")
  const [isImportingShare, setIsImportingShare] = useState(false)

  const getAllCasesWithRetry = async () => {
    const maxRetries = isWebKitBrowser() ? 3 : 1
    let lastError: unknown = null
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await getAllCases()
      } catch (e) {
        lastError = e
        if (attempt < maxRetries - 1) {
          await sleep(100 * (attempt + 1))
        }
      }
    }
    throw lastError
  }

  const loadCases = async () => {
    setIsLoading(true)
    try {
      // 初回起動時にデフォルトCASEをセットアップ
      await initializeApp()

      // WebKit環境では、初期化直後のIndexedDB取得が不安定なことがあるため、取得側で最小限リトライする
      const casesData = await getAllCasesWithRetry()
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

  // 共有リンク（#share=...）の読み取り
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const parse = () => {
      const sharedData = getSharedCaseFromUrl()
      if (!sharedData) {
        setSharedCase(null)
        setShareError("")
        return
      }
      
      try {
        setSharedCase(sharedData)
        setShareError("")
      } catch {
        setSharedCase(null)
        setShareError("共有リンクの解析に失敗しました。URLが正しいか確認してください。")
      }
    }
    
    parse()
    window.addEventListener("hashchange", parse)
    return () => window.removeEventListener("hashchange", parse)
  }, [])

  const closeSharePreview = () => {
    if (typeof window === "undefined") return
    history.replaceState(null, "", window.location.pathname + window.location.search)
    setSharedCase(null)
    setShareError("")
  }

  const importShareAsCase = async () => {
    if (!sharedCase) return
    setIsImportingShare(true)
    setShareError("")
    
    try {
      // Google DriveのURLを変換
      const beforeUrl = convertGoogleDriveUrl(sharedCase.beforeUrl)
      const afterUrl = convertGoogleDriveUrl(sharedCase.afterUrl)
      
      // 画像を取得 → リサイズ最適化 → IndexedDBへ保存
      const beforeResized = await fetchAndResizeImage(beforeUrl, 2000, 0.9)
      const afterResized = await fetchAndResizeImage(afterUrl, 2000, 0.9)

      const beforeImageId = uuidv4()
      const afterImageId = uuidv4()

      const beforeRecord: ImageRecord = {
        id: beforeImageId,
        name: beforeUrl.split('/').pop() || 'before.jpg',
        type: beforeResized.type,
        size: beforeResized.blob.size,
        blob: beforeResized.blob,
        width: beforeResized.width,
        height: beforeResized.height,
        createdAt: Date.now(),
      }
      const afterRecord: ImageRecord = {
        id: afterImageId,
        name: afterUrl.split('/').pop() || 'after.jpg',
        type: afterResized.type,
        size: afterResized.blob.size,
        blob: afterResized.blob,
        width: afterResized.width,
        height: afterResized.height,
        createdAt: Date.now(),
      }

      await addImage(beforeRecord)
      await addImage(afterRecord)

      const casesData = await getAllCases()
      const order = casesData.length

      const newCase: CaseRecord = {
        id: uuidv4(),
        title: sharedCase.title ? `共有: ${sharedCase.title}` : `共有CASE ${order + 1}`,
        description: sharedCase.description || "",
        order,
        beforeImageId: beforeImageId,
        afterImageId: afterImageId,
        view: {
          before: sharedCase.view.before,
          after: sharedCase.view.after,
        },
        initialSliderPosition: sharedCase.initialSliderPosition,
        animationType: sharedCase.animationType,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      await addCase(newCase)

      await loadCases()
      closeSharePreview()
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "共有CASEの保存に失敗しました。"
      setShareError(message)
    } finally {
      setIsImportingShare(false)
    }
  }

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
    <div className="mx-auto max-w-7xl space-y-12 px-6 py-10 md:px-10 overflow-x-hidden">
      {/* Share preview */}
      {shareError && (
        <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">共有リンク</h2>
              <p className="text-sm text-destructive">{shareError}</p>
            </div>
            <Button variant="outline" onClick={closeSharePreview}>
              閉じる
            </Button>
          </div>
        </section>
      )}

      {sharedCase && (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">共有プレビュー</h2>
              <p className="text-sm text-muted-foreground">
                画像URLと設定をプレビューしています。保存するとIndexedDBに「共有CASE」として登録されます。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={importShareAsCase} disabled={isImportingShare}>
                {isImportingShare ? "保存中..." : "共有CASEとして保存"}
              </Button>
              <Button variant="outline" onClick={closeSharePreview}>
                閉じる
              </Button>
            </div>
          </div>
          {shareError && <p className="mt-3 text-sm text-destructive">{shareError}</p>}

          <div className="mt-6">
            <BeforeAfterSlider
              beforeImage={sharedCase.beforeUrl}
              afterImage={sharedCase.afterUrl}
              beforeLabel="既存（Before）"
              afterLabel="改修案（After）"
              className="w-full border border-border bg-white shadow-lg"
              defaultBeforeScale={sharedCase.view.before.scale}
              defaultBeforeX={sharedCase.view.before.x}
              defaultBeforeY={sharedCase.view.before.y}
              defaultAfterScale={sharedCase.view.after.scale}
              defaultAfterX={sharedCase.view.after.x}
              defaultAfterY={sharedCase.view.after.y}
              initialSliderPosition={sharedCase.initialSliderPosition}
              animationType={sharedCase.animationType}
            />
            <div className="mt-3 text-xs text-muted-foreground">
              Google Drive直リンクの注意: 共有ページURLは画像として取得できず失敗することがあります。画像として直接アクセスできるURLを指定してください。
            </div>
          </div>
        </section>
      )}

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
  )
}


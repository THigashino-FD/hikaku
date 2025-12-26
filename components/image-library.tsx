"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import {
  getAllImages,
  addImage,
  deleteImage,
  getImagesUsedByCases,
  ImageRecord,
  ImageRecordWithBlob,
  createObjectURL,
  revokeObjectURL,
  clearAllData,
} from "@/lib/db"
import { initializeApp } from "@/lib/init"
import { resizeImage, formatFileSize, isAllowedImageType, fetchAndResizeImage } from "@/lib/image-utils"
import { v4 as uuidv4 } from "uuid"
import { convertGoogleDriveUrl } from "@/lib/share"
import { useToast } from "@/components/ui/toast"
import { IMAGE_CONSTANTS, ALLOWED_HOSTNAMES } from "@/lib/constants"
import { logger } from "@/lib/logger"
import { type AppError } from "@/lib/types/errors"

interface ImageLibraryProps {
  onClose: () => void
}

export function ImageLibrary({ onClose }: ImageLibraryProps) {
  const [images, setImages] = useState<ImageRecordWithBlob[]>([])
  const [usageMap, setUsageMap] = useState<Map<string, string[]>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 }) // 進捗状態
  const [searchQuery, setSearchQuery] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [isAddingFromUrl, setIsAddingFromUrl] = useState(false)
  const [filterUrlOnly, setFilterUrlOnly] = useState(false) // URL画像のみフィルタ
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; message: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false) // ドラッグ中フラグ
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { showToast } = useToast()

  // フォーカストラップとESCキー対応
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
      
      // Tab key focus trap
      if (e.key === 'Tab') {
        if (!modalRef.current) return
        
        const focusableElements = modalRef.current.querySelectorAll(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
        
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }
    }
    
    // 初回フォーカス
    closeButtonRef.current?.focus()
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  // URL検証関数
  const validateUrl = (url: string): { valid: boolean; message: string } => {
    if (!url.trim()) {
      return { valid: false, message: "" }
    }

    try {
      const urlObj = new URL(url)
      
      // プロトコルチェック（HTTPSのみ許可）
      if (urlObj.protocol === 'http:') {
        return { valid: false, message: "⚠️ HTTPSのURLのみ使用可能です。セキュリティ上の理由により、HTTPは許可されていません。" }
      }
      
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return { valid: false, message: "https:// で始まるURLを入力してください" }
      }

      // 画像拡張子チェック（簡易）
      const pathname = urlObj.pathname.toLowerCase()
      const hasImageExt = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(pathname)
      const isGoogleDrive = urlObj.hostname.includes(ALLOWED_HOSTNAMES[0])
      
      if (!hasImageExt && !isGoogleDrive) {
        return { valid: false, message: "画像ファイル（.jpg, .png, .gif, .webp等）のURLを入力してください" }
      }

      return { valid: true, message: "✓ 有効なURLです" }
    } catch {
      return { valid: false, message: "無効なURL形式です" }
    }
  }

  // URL入力時のリアルタイム検証
  useEffect(() => {
    if (imageUrl.trim()) {
      const validation = validateUrl(imageUrl)
      setUrlValidation(validation)
    } else {
      setUrlValidation(null)
    }
  }, [imageUrl])

  const loadData = async () => {
    try {
      // /manage/images へ直アクセスされた場合でも、デフォルト画像/CASEがセットアップされるようにする
      await initializeApp()
      const [imagesData, usage] = await Promise.all([
        getAllImages(),
        getImagesUsedByCases(),
      ])
      setImages(imagesData)
      setUsageMap(usage)
    } catch (error) {
      logger.error("Failed to load images:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    await processFiles(Array.from(files))

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // ファイル処理を共通化
  const processFiles = async (files: File[]) => {
    setIsUploading(true)
    setUploadProgress({ current: 0, total: files.length })

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress({ current: i + 1, total: files.length })

      if (!isAllowedImageType(file)) {
        showToast(`${file.name} はサポートされていない画像形式です`, "error")
        continue
      }

        // リサイズと最適化
        const { blob, width, height } = await resizeImage(file, IMAGE_CONSTANTS.MAX_DIMENSION, IMAGE_CONSTANTS.QUALITY)

        const imageRecord: ImageRecord = {
          id: uuidv4(),
          name: file.name,
          type: file.type,
          size: blob.size,
          blob: blob,
          width,
          height,
          createdAt: Date.now(),
        }

        await addImage(imageRecord)
      }

      await loadData()
      showToast(`${files.length}件の画像を追加しました`, "success")
    } catch (error) {
      logger.error("Failed to upload images:", error)
      showToast("画像の追加に失敗しました", "error")
    } finally {
      setIsUploading(false)
      setUploadProgress({ current: 0, total: 0 })
    }
  }

  // ドラッグ&ドロップハンドラー
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // モーダル外に出た場合のみドラッグ状態を解除
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )

    if (files.length === 0) {
      showToast("画像ファイルをドロップしてください", "warning")
      return
    }

    await processFiles(files)
  }

  const handleDelete = async (id: string) => {
    const usage = usageMap.get(id)
    
    if (usage && usage.length > 0) {
      const confirm = window.confirm(
        `この画像は以下のCASEで使用されています：\n${usage.join("\n")}\n\n削除してもよろしいですか？`
      )
      if (!confirm) return
    } else {
      if (!window.confirm("この画像を削除してもよろしいですか？")) {
        return
      }
    }

    try {
      await deleteImage(id)
      await loadData()
    } catch (error) {
      logger.error("Failed to delete image:", error)
      showToast("画像の削除に失敗しました", "error")
    }
  }

  const handleAddFromUrl = async () => {
    if (!imageUrl.trim()) {
      showToast("画像URLを入力してください", "warning")
      return
    }

    setIsAddingFromUrl(true)

    try {
      // Google DriveのURLを変換
      const normalizedUrl = convertGoogleDriveUrl(imageUrl.trim())
      
      // URLから画像を取得してリサイズ
      const { blob, width, height, type } = await fetchAndResizeImage(normalizedUrl, IMAGE_CONSTANTS.MAX_DIMENSION, IMAGE_CONSTANTS.QUALITY)

      const imageRecord: ImageRecord = {
        id: uuidv4(),
        name: normalizedUrl.split('/').pop() || 'image-from-url.jpg',
        type: type,
        size: blob.size,
        blob: blob,
        width,
        height,
        sourceUrl: normalizedUrl, // 元URLを保存
        createdAt: Date.now(),
      }

      await addImage(imageRecord)
      await loadData()
      
      // リセット
      setImageUrl("")
      setShowUrlInput(false)
      showToast("URLから画像を追加しました", "success")
    } catch (error) {
      logger.error("Failed to add image from URL:", error)
      
      // AppErrorの場合はユーザー向けメッセージを取得
      let errorMessage = '不明なエラー'
      if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        // AppErrorの場合
        try {
          const appError = error as AppError
          // messageプロパティを直接使用（toUserMessageは改行を含む可能性があるため）
          errorMessage = appError.message || '不明なエラー'
          // userActionがあれば追加情報として含める（トーストでは1行目のみ表示）
        } catch {
          errorMessage = '不明なエラー'
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || '不明なエラー'
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        // その他の場合（オブジェクトなど）は文字列化を試みる
        try {
          const errorStr = JSON.stringify(error)
          // 空のオブジェクトの場合はデフォルトメッセージを使用
          if (errorStr === '{}' || errorStr === 'null') {
            errorMessage = '不明なエラーが発生しました'
          } else {
            errorMessage = errorStr
          }
        } catch {
          errorMessage = '不明なエラー'
        }
      }
      
      // トーストメッセージは1行で表示（改行は含めない）
      const toastMessage = errorMessage.split('\n')[0].trim() || '不明なエラー'
      showToast(`URLからの画像追加に失敗しました: ${toastMessage}`, "error")
    } finally {
      setIsAddingFromUrl(false)
    }
  }

  const handleClearAll = async () => {
    if (
      !window.confirm(
        "全てのデータ（画像・CASE）を削除してもよろしいですか？\nこの操作は取り消せません。"
      )
    ) {
      return
    }

    if (!window.confirm("本当によろしいですか？")) {
      return
    }

    try {
      await clearAllData()
      await loadData()
      showToast("全てのデータを削除しました", "success")
    } catch (error) {
      logger.error("Failed to clear data:", error)
      showToast("データの削除に失敗しました", "error")
    }
  }

  const filteredImages = images
    .filter((img) =>
      img.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((img) => !filterUrlOnly || !!img.sourceUrl) // URL画像のみフィルタを適用

  const totalSize = images.reduce((sum, img) => sum + img.size, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="image-library-title">
      <main 
        ref={modalRef} 
        className="relative flex h-full max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-background shadow-xl"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* ドラッグ&ドロップオーバーレイ */}
        {isDragging && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-sm border-4 border-dashed border-primary">
            <div className="text-center">
              <svg className="mx-auto h-16 w-16 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-4 text-xl font-semibold text-primary">画像をドロップして追加</p>
            </div>
          </div>
        )}
        
        <header className="sticky top-0 z-40 border-b bg-card py-4 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
            <h1 id="image-library-title" className="text-xl font-bold">画像ライブラリ</h1>
            <Button ref={closeButtonRef} variant="outline" onClick={onClose} aria-label="画像ライブラリを閉じる">
              閉じる
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-6 px-6 py-10 md:px-10">
        {/* Stats & Actions */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold">{images.length}</span> 画像
            </div>
            <div>
              <span className="font-semibold">{formatFileSize(totalSize)}</span> 使用中
            </div>
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              URLから画像を追加
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="gap-2"
              title="対応形式: JPEG, PNG, GIF, WebP"
            >
              {isUploading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {uploadProgress.total > 1 
                    ? `処理中... (${uploadProgress.current}/${uploadProgress.total})`
                    : '処理中...'}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  ローカルに画像を保存
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleClearAll} className="text-destructive">
              全データ削除
            </Button>
          </div>
          
          {/* ファイルサイズ情報 */}
          <div className="w-full text-xs text-muted-foreground">
            ※ 追加時、画像は自動的に最大{IMAGE_CONSTANTS.MAX_DIMENSION}px、品質{IMAGE_CONSTANTS.QUALITY * 100}%に最適化されます（JPEG, PNG, GIF, WebP対応）
          </div>
        </section>

        {/* URL Input Section */}
        {showUrlInput && (
          <section className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-semibold">URLから画像を追加</h3>
            <div className="mb-4 rounded-md bg-blue-50 p-4 text-sm">
              <h4 className="mb-2 font-semibold text-blue-900">💡 共有機能について</h4>
              <p className="mb-2 text-blue-800">
                <strong>パソコンから追加した画像は、あなたのブラウザにだけ保存されるため、他の人と共有できません。</strong>
              </p>
              <p className="text-blue-700">
                共有したいCASEを作るには、GoogleドライブなどのオンラインURLから画像を追加してください。
                URLから追加した画像は、共有リンクを通じて他の人も同じ画像を見ることができます。
              </p>
            </div>
            <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-sm">
              <p className="text-amber-800">
                <strong>⚠️ セキュリティ上の理由により、使用可能なURLを制限しています。</strong>
              </p>
              <p className="mt-1 text-amber-700">
                HTTPSのパブリックな画像URLのみ使用可能です。プライベートネットワークへのアクセスは許可されていません。
              </p>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              画像の直リンクURLを入力してください。Google DriveのURLは自動で変換されます。
            </p>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAddingFromUrl && urlValidation?.valid) {
                      handleAddFromUrl()
                    }
                  }}
                  disabled={isAddingFromUrl}
                  className={`flex-1 ${urlValidation && !urlValidation.valid && imageUrl.trim() ? "border-destructive" : ""} ${urlValidation?.valid ? "border-green-500" : ""}`}
                />
                <Button
                  onClick={handleAddFromUrl}
                  disabled={isAddingFromUrl || !imageUrl.trim() || (urlValidation ? !urlValidation.valid : false)}
                >
                  {isAddingFromUrl ? "取り込み中..." : "追加"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUrlInput(false)
                    setImageUrl("")
                    setUrlValidation(null)
                  }}
                  disabled={isAddingFromUrl}
                >
                  キャンセル
                </Button>
              </div>
              
              {/* バリデーション結果表示 */}
              {urlValidation && imageUrl.trim() && (
                <div className={`flex items-center gap-2 text-sm ${urlValidation.valid ? "text-green-600" : "text-destructive"}`}>
                  {urlValidation.valid ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{urlValidation.message}</span>
                </div>
              )}

              {/* Google Drive URL例 */}
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">Google DriveのURL例を見る</summary>
                <div className="mt-2 space-y-1 rounded bg-muted p-2">
                  <p className="font-medium">対応URL形式：</p>
                  <code className="block">https://drive.google.com/file/d/[FILE_ID]/view</code>
                  <code className="block">https://drive.google.com/uc?id=[FILE_ID]</code>
                  <p className="mt-2 text-[10px]">※ 共有設定を「リンクを知っている全員」に変更してください</p>
                </div>
              </details>
            </div>
          </section>
        )}

        {/* Search & Filter */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            type="search"
            placeholder="画像名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button
            variant={filterUrlOnly ? "default" : "outline"}
            onClick={() => setFilterUrlOnly(!filterUrlOnly)}
            className="gap-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {filterUrlOnly ? "URL画像のみ表示中" : "すべて表示"}
          </Button>
        </section>

        {/* Images Grid */}
        <section>
          {filteredImages.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery || filterUrlOnly
                  ? "条件に一致する画像が見つかりませんでした"
                  : "画像がありません。「ローカルに画像を保存」ボタンから追加してください。"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  usage={usageMap.get(image.id) || []}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
          </div>
        </div>
      </main>
    </div>
  )
}

interface ImageCardProps {
  image: ImageRecordWithBlob
  usage: string[]
  onDelete: (id: string) => void
}

function ImageCard({ image, usage, onDelete }: ImageCardProps) {
  const imageUrl = useMemo(() => createObjectURL(image.blob), [image.blob])
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    return () => {
      revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  return (
    <>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
        {/* Thumbnail */}
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="relative aspect-video w-full overflow-hidden bg-muted cursor-pointer group"
        >
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
              <svg className="h-8 w-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {imageUrl && (
            <>
              <Image 
                src={imageUrl} 
                alt={image.name} 
                fill
                className="object-cover transition-transform group-hover:scale-105"
                onLoad={() => setImageLoaded(true)}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
              {/* 拡大アイコンオーバーレイ */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <svg className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </div>
            </>
          )}
        </button>

      {/* Info */}
      <div className="space-y-2 p-3">
        <div className="truncate text-sm font-medium" title={image.name}>
          {image.name}
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {image.width} × {image.height}
          </span>
          <span>{formatFileSize(image.size)}</span>
        </div>

        {image.sourceUrl && (
          <div className="rounded bg-muted/50 p-2 text-xs">
            <div className="font-semibold text-foreground">元URL:</div>
            <div className="truncate text-muted-foreground" title={image.sourceUrl}>
              {image.sourceUrl}
            </div>
          </div>
        )}

        {usage.length > 0 && (
          <div className="rounded border border-primary/20 bg-primary/5 p-2 text-xs">
            <div className="font-semibold text-primary">使用中:</div>
            {usage.map((u, i) => (
              <div key={i} className="text-muted-foreground">
                {u}
              </div>
            ))}
          </div>
        )}

        {usage.length > 0 ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="w-full cursor-not-allowed opacity-50"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              削除不可（使用中）
            </Button>
            <p className="text-[10px] text-muted-foreground">
              ※ この画像を削除するには、使用しているCASEから割り当てを解除してください
            </p>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(image.id)}
            className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            削除
          </Button>
        )}
      </div>
    </div>

      {/* 画像プレビューモーダル */}
      {showPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowPreview(false)}
        >
          <button
            onClick={() => setShowPreview(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="閉じる"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div 
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={image.name}
                className="max-h-[90vh] max-w-[90vw] object-contain"
              />
            )}
            
            {/* 画像情報オーバーレイ */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
              <div className="text-lg font-semibold">{image.name}</div>
              <div className="mt-1 flex flex-wrap gap-4 text-sm">
                <span>{image.width} × {image.height}</span>
                <span>{formatFileSize(image.size)}</span>
                {image.sourceUrl && (
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    URL画像
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


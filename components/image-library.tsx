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
  createObjectURL,
  revokeObjectURL,
  clearAllData,
} from "@/lib/db"
import { resizeImage, formatFileSize, isAllowedImageType, fetchAndResizeImage } from "@/lib/image-utils"
import { v4 as uuidv4 } from "uuid"
import { convertGoogleDriveUrl } from "@/lib/share"
import { useToast } from "@/components/ui/toast"

interface ImageLibraryProps {
  onClose: () => void
}

export function ImageLibrary({ onClose }: ImageLibraryProps) {
  const [images, setImages] = useState<ImageRecord[]>([])
  const [usageMap, setUsageMap] = useState<Map<string, string[]>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [isAddingFromUrl, setIsAddingFromUrl] = useState(false)
  const [filterUrlOnly, setFilterUrlOnly] = useState(false) // URL画像のみフィルタ
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  const loadData = async () => {
    try {
      const [imagesData, usage] = await Promise.all([
        getAllImages(),
        getImagesUsedByCases(),
      ])
      setImages(imagesData)
      setUsageMap(usage)
    } catch (error) {
      console.error("Failed to load images:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

      if (!isAllowedImageType(file)) {
        showToast(`${file.name} はサポートされていない画像形式です`, "error")
        continue
      }

        // リサイズと最適化
        const { blob, width, height } = await resizeImage(file, 2000, 0.9)

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
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Failed to upload images:", error)
      showToast("画像のアップロードに失敗しました", "error")
    } finally {
      setIsUploading(false)
    }
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
      console.error("Failed to delete image:", error)
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
      const { blob, width, height, type } = await fetchAndResizeImage(normalizedUrl, 2000, 0.9)

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
      console.error("Failed to add image from URL:", error)
      showToast(`URLからの画像追加に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`, "error")
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
      console.error("Failed to clear data:", error)
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
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
          <h1 className="text-xl font-bold">画像ライブラリ</h1>
          <Button variant="outline" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </header>

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
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>処理中...</>
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
                  画像をアップロード
                </>
              )}
            </Button>
            <Button
              variant="outline"
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
            <Button variant="outline" onClick={handleClearAll} className="text-destructive">
              全データ削除
            </Button>
          </div>
        </section>

        {/* URL Input Section */}
        {showUrlInput && (
          <section className="rounded-lg border bg-card p-4 shadow-sm">
            <h3 className="mb-3 font-semibold">URLから画像を追加</h3>
            <div className="mb-4 rounded-md bg-blue-50 p-4 text-sm">
              <h4 className="mb-2 font-semibold text-blue-900">💡 共有機能について</h4>
              <p className="mb-2 text-blue-800">
                <strong>アップロードした画像は、あなたのブラウザにだけ保存されるため、他の人と共有できません。</strong>
              </p>
              <p className="text-blue-700">
                共有したいCASEを作るには、GoogleドライブなどのオンラインURLから画像を追加してください。
                URLから追加した画像は、共有リンクを通じて他の人も同じ画像を見ることができます。
              </p>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              画像の直リンクURLを入力してください。Google DriveのURLは自動で変換されます。
            </p>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAddingFromUrl) {
                    handleAddFromUrl()
                  }
                }}
                disabled={isAddingFromUrl}
                className="flex-1"
              />
              <Button
                onClick={handleAddFromUrl}
                disabled={isAddingFromUrl || !imageUrl.trim()}
              >
                {isAddingFromUrl ? "取り込み中..." : "追加"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowUrlInput(false)
                  setImageUrl("")
                }}
                disabled={isAddingFromUrl}
              >
                キャンセル
              </Button>
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
                  : "画像がありません。「画像をアップロード」ボタンから追加してください。"}
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
    </main>
  )
}

interface ImageCardProps {
  image: ImageRecord
  usage: string[]
  onDelete: (id: string) => void
}

function ImageCard({ image, usage, onDelete }: ImageCardProps) {
  const imageUrl = useMemo(() => createObjectURL(image.blob), [image.blob])
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    return () => {
      revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
            <svg className="h-8 w-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {imageUrl && (
          <Image 
            src={imageUrl} 
            alt={image.name} 
            fill
            className="object-cover"
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        )}
      </div>

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

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(image.id)}
          className="w-full text-destructive"
        >
          削除
        </Button>
      </div>
    </div>
  )
}


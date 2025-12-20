"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { resizeImage, formatFileSize, isAllowedImageType } from "@/lib/image-utils"
import { v4 as uuidv4 } from "uuid"

interface ImageLibraryProps {
  onClose: () => void
}

export function ImageLibrary({ onClose }: ImageLibraryProps) {
  const [images, setImages] = useState<ImageRecord[]>([])
  const [usageMap, setUsageMap] = useState<Map<string, string[]>>(new Map())
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
          alert(`${file.name} はサポートされていない画像形式です`)
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
      alert("画像のアップロードに失敗しました")
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
      alert("画像の削除に失敗しました")
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
      alert("全てのデータを削除しました")
    } catch (error) {
      console.error("Failed to clear data:", error)
      alert("データの削除に失敗しました")
    }
  }

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <Button variant="outline" onClick={handleClearAll} className="text-destructive">
              全データ削除
            </Button>
          </div>
        </section>

        {/* Search */}
        <section>
          <Input
            type="search"
            placeholder="画像名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </section>

        {/* Images Grid */}
        <section>
          {filteredImages.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery
                  ? "検索結果が見つかりませんでした"
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

  useEffect(() => {
    return () => {
      revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {imageUrl && (
          <img src={imageUrl} alt={image.name} className="h-full w-full object-cover" />
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


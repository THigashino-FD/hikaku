"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { ImageRecordWithBlob, createObjectURL, revokeObjectURL } from "@/lib/db"
import { cn } from "@/lib/utils"

interface ImagePickerProps {
  images: ImageRecordWithBlob[]
  selectedImageId?: string
  onSelect: (imageId: string | undefined) => void
  label: string
}

export function ImagePicker({ images, selectedImageId, onSelect, label }: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map())

  // 画像URLを生成
  useEffect(() => {
    const urls = new Map<string, string>()
    
    images.forEach((img) => {
      const url = createObjectURL(img.blob)
      urls.set(img.id, url)
    })
    
    setImageUrls(urls)

    return () => {
      urls.forEach((url) => revokeObjectURL(url))
    }
  }, [images])

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedImage = images.find((img) => img.id === selectedImageId)

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      
      {/* 選択中の画像またはプレースホルダー */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-32 w-full overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/50 transition-colors hover:border-primary hover:bg-muted"
        aria-label="画像を選択"
      >
        {selectedImage && imageUrls.get(selectedImage.id) ? (
          <>
            <Image
              src={imageUrls.get(selectedImage.id)!}
              alt={selectedImage.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <div className="flex h-full items-center justify-center text-white">
                <span className="text-sm font-medium">画像を変更</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium">画像を選択</span>
          </div>
        )}
      </button>

      {selectedImage && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{selectedImage.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(undefined)
            }}
            className="h-6 px-2"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="ml-1">解除</span>
          </Button>
        </div>
      )}

      {/* 画像選択モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg bg-card shadow-xl">
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="text-lg font-semibold">{label}を選択</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false)
                  setSearchQuery("")
                }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* 検索バー */}
            <div className="border-b p-4">
              <Input
                type="search"
                placeholder="画像名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* 画像グリッド */}
            <div className="max-h-[50vh] overflow-y-auto p-4">
              {filteredImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <svg className="mb-2 h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm">
                    {searchQuery ? "検索結果が見つかりませんでした" : "画像がありません"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {filteredImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        onSelect(img.id)
                        setIsOpen(false)
                        setSearchQuery("")
                      }}
                      className={cn(
                        "group relative overflow-hidden rounded-lg border-2 transition-all",
                        selectedImageId === img.id
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-border hover:border-primary"
                      )}
                    >
                      <div className="relative aspect-square">
                        {imageUrls.get(img.id) && (
                          <Image
                            src={imageUrls.get(img.id)!}
                            alt={img.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        )}
                        
                        {/* 選択済みバッジ */}
                        {selectedImageId === img.id && (
                          <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                            <svg className="h-4 w-4 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}

                        {/* URL画像バッジ */}
                        {img.sourceUrl && (
                          <div className="absolute left-2 top-2 rounded bg-blue-500/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                            URL
                          </div>
                        )}
                      </div>
                      
                      <div className="border-t bg-background p-2">
                        <p className="truncate text-xs font-medium">{img.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


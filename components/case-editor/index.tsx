"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import type { CaseRecord, ImageRecordWithBlob } from "@/lib/db"
import { BeforeAfterSlider } from "@/components/before-after-slider"
import { useToast } from "@/components/ui/toast"
import { useCaseEditor } from "./hooks/use-case-editor"
import { BasicInfoSection } from "./basic-info-section"
import { ImageSelectionSection } from "./image-selection-section"
import { InitialSettingsSection } from "./initial-settings-section"

interface CaseEditorProps {
  caseRecord: CaseRecord
  images: ImageRecordWithBlob[]
  onSave: (caseRecord: CaseRecord) => void
  onCancel: () => void
}

export function CaseEditor({ caseRecord, images, onSave, onCancel }: CaseEditorProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const { showToast } = useToast()

  const {
    editedCase,
    setEditedCase,
    beforeImageUrl,
    afterImageUrl,
    handleSave,
    handleViewChange,
  } = useCaseEditor({ caseRecord, showToast, onSave })

  // フォーカストラップとESCキー対応
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
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
    cancelButtonRef.current?.focus()
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="case-editor-title">
      <main ref={modalRef} className="relative flex h-full max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-background shadow-xl">
        <header className="sticky top-0 z-40 border-b bg-card py-4 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
            <h1 id="case-editor-title" className="text-xl font-bold">CASE編集</h1>
            <div className="flex gap-2">
              <Button ref={cancelButtonRef} variant="outline" onClick={onCancel} aria-label="キャンセル">
                キャンセル
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 md:px-10">
            {/* Basic Info */}
            <BasicInfoSection
              title={editedCase.title}
              description={editedCase.description || ""}
              onTitleChange={(title) =>
                setEditedCase({ ...editedCase, title })
              }
              onDescriptionChange={(description) =>
                setEditedCase({ ...editedCase, description })
              }
            />

            {/* Image Selection */}
            <ImageSelectionSection
              images={images}
              beforeImageId={editedCase.beforeImageId}
              afterImageId={editedCase.afterImageId}
              onBeforeSelect={(imageId) =>
                setEditedCase({ ...editedCase, beforeImageId: imageId })
              }
              onAfterSelect={(imageId) =>
                setEditedCase({ ...editedCase, afterImageId: imageId })
              }
            />

            {/* Initial View Settings */}
            <InitialSettingsSection
              initialSliderPosition={editedCase.initialSliderPosition}
              animationType={editedCase.animationType}
              viewBefore={editedCase.view.before}
              viewAfter={editedCase.view.after}
              caseId={editedCase.id}
              onSliderPositionChange={(position) =>
                setEditedCase({ ...editedCase, initialSliderPosition: position })
              }
              onAnimationTypeChange={(type) =>
                setEditedCase({ ...editedCase, animationType: type })
              }
              onViewChange={handleViewChange}
            />

            {/* Preview */}
            {beforeImageUrl && afterImageUrl && (
              <section className="space-y-4 rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold">プレビュー</h2>
                <BeforeAfterSlider
                  beforeImage={beforeImageUrl}
                  afterImage={afterImageUrl}
                  beforeLabel="Before"
                  afterLabel="After"
                  defaultBeforeScale={editedCase.view.before.scale}
                  defaultBeforeX={editedCase.view.before.x}
                  defaultBeforeY={editedCase.view.before.y}
                  defaultAfterScale={editedCase.view.after.scale}
                  defaultAfterX={editedCase.view.after.x}
                  defaultAfterY={editedCase.view.after.y}
                  className="border border-border bg-white shadow-lg"
                />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


import { useState, useEffect, useRef, useCallback } from "react"
import {
  type CaseRecord,
  getImageById,
  createObjectURL,
  revokeObjectURL,
} from "@/lib/db"

interface UseCaseEditorProps {
  caseRecord: CaseRecord
  showToast: (message: string, type: "success" | "error" | "warning") => void
  onSave: (caseRecord: CaseRecord) => void
}

export function useCaseEditor({ caseRecord, showToast, onSave }: UseCaseEditorProps) {
  const [editedCase, setEditedCase] = useState<CaseRecord>(caseRecord)
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>("")
  const [afterImageUrl, setAfterImageUrl] = useState<string>("")
  const beforeUrlRef = useRef<string>("")
  const afterUrlRef = useRef<string>("")

  useEffect(() => {
    let cancelled = false

    const loadImages = async () => {
      // 前回のURLをクリーンアップ
      if (beforeUrlRef.current) {
        revokeObjectURL(beforeUrlRef.current)
        beforeUrlRef.current = ""
      }
      if (afterUrlRef.current) {
        revokeObjectURL(afterUrlRef.current)
        afterUrlRef.current = ""
      }

      if (editedCase.beforeImageId) {
        const image = await getImageById(editedCase.beforeImageId)
        if (image && !cancelled) {
          const url = createObjectURL(image.blob)
          beforeUrlRef.current = url
          setBeforeImageUrl(url)
        }
      } else if (!cancelled) {
        setBeforeImageUrl("")
      }

      if (editedCase.afterImageId) {
        const image = await getImageById(editedCase.afterImageId)
        if (image && !cancelled) {
          const url = createObjectURL(image.blob)
          afterUrlRef.current = url
          setAfterImageUrl(url)
        }
      } else if (!cancelled) {
        setAfterImageUrl("")
      }
    }

    loadImages()

    return () => {
      cancelled = true
      if (beforeUrlRef.current) revokeObjectURL(beforeUrlRef.current)
      if (afterUrlRef.current) revokeObjectURL(afterUrlRef.current)
      beforeUrlRef.current = ""
      afterUrlRef.current = ""
    }
  }, [editedCase.beforeImageId, editedCase.afterImageId])

  const handleSave = useCallback(() => {
    // バリデーション
    if (!editedCase.title.trim()) {
      showToast("タイトルを入力してください", "warning")
      return
    }

    if (!editedCase.beforeImageId || !editedCase.afterImageId) {
      showToast("Before/After両方の画像を選択してください", "warning")
      return
    }

    onSave(editedCase)
  }, [editedCase, showToast, onSave])

  const handleViewChange = useCallback((
    side: "before" | "after",
    field: "scale" | "x" | "y",
    value: number
  ) => {
    setEditedCase((prev) => ({
      ...prev,
      view: {
        ...prev.view,
        [side]: {
          ...prev.view[side],
          [field]: value,
        },
      },
    }))
  }, [])

  return {
    editedCase,
    setEditedCase,
    beforeImageUrl,
    afterImageUrl,
    handleSave,
    handleViewChange,
  }
}


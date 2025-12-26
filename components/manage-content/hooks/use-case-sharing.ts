import { useState, useCallback } from "react"
import { getImageById, type CaseRecord } from "@/lib/db"
import { generateShareUrl, type SharedCaseData } from "@/lib/share"
import { logger } from "@/lib/logger"

interface UseCaseSharingProps {
  showToast: (message: string, type: "success" | "error" | "warning") => void
}

export function useCaseSharing({ showToast }: UseCaseSharingProps) {
  const [sharingCase, setSharingCase] = useState<CaseRecord | null>(null)
  const [shareLink, setShareLink] = useState<string>("")
  const [shareError, setShareError] = useState<string>("")

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
      if (!url) {
        throw new Error('共有リンクの生成に失敗しました')
      }
      setShareLink(url)
      setSharingCase(caseRecord)
      
      // 自動コピー
      try {
        await navigator.clipboard.writeText(url)
        showToast("共有リンクを生成してコピーしました", "success")
      } catch {
        showToast("共有リンクを生成しました（コピーは失敗）", "warning")
      }
    } catch (error) {
      logger.error("Failed to generate share link:", error)
      setShareError("共有リンクの生成に失敗しました")
      setSharingCase(caseRecord)
    }
  }, [showToast])

  const copyShareLink = useCallback(async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      showToast("共有リンクをコピーしました", "success")
    } catch {
      showToast("コピーに失敗しました", "error")
    }
  }, [shareLink, showToast])

  const closeShareDialog = useCallback(() => {
    setSharingCase(null)
    setShareLink("")
    setShareError("")
  }, [])

  return {
    sharingCase,
    shareLink,
    shareError,
    handleShare,
    copyShareLink,
    closeShareDialog,
    setSharingCase,
    setShareLink,
    setShareError,
  }
}


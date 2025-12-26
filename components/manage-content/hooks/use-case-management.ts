import { useCallback } from "react"
import { addCase, updateCase, deleteCase, reorderCases, type CaseRecord } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { logger } from "@/lib/logger"

interface UseCaseManagementProps {
  cases: CaseRecord[]
  showToast: (message: string, type: "success" | "error" | "warning") => void
  loadData: () => Promise<void>
}

export function useCaseManagement({ cases, showToast, loadData }: UseCaseManagementProps) {
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
  }, [cases.length, showToast, loadData])

  const handleSaveCase = useCallback(async (caseRecord: CaseRecord) => {
    try {
      await updateCase(caseRecord)
      await loadData()
    } catch (error) {
      logger.error("Failed to update case:", error)
      showToast("CASEの更新に失敗しました", "error")
      throw error
    }
  }, [showToast, loadData])

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
  }, [showToast, loadData])

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
  }, [cases.length, showToast, loadData])

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
  }, [cases, showToast, loadData])

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
  }, [cases, showToast, loadData])

  return {
    handleAddCase,
    handleSaveCase,
    handleDeleteCase,
    handleDuplicateCase,
    handleMoveUp,
    handleMoveDown,
  }
}


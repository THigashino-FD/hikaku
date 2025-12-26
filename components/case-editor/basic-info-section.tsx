"use client"

import { Input } from "@/components/ui/input"

interface BasicInfoSectionProps {
  title: string
  description: string
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
}

export function BasicInfoSection({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
}: BasicInfoSectionProps) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">基本情報</h2>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">
          タイトル <span className="text-destructive">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="例: CASE 01"
          required
          className={!title.trim() ? "border-destructive" : ""}
        />
        {!title.trim() && (
          <p className="text-xs text-destructive">タイトルは必須です</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">説明（任意）</label>
        <Input
          value={description || ""}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="例: リビングの改築提案"
        />
      </div>
    </section>
  )
}


"use client"

export function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-border p-12 text-center">
      <p className="text-muted-foreground">
        CASEがありません。「新規CASE追加」ボタンから作成してください。
      </p>
    </div>
  )
}


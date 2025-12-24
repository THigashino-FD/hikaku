"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">エラーが発生しました</h2>
        <p className="text-muted-foreground">
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        <div className="flex justify-center gap-4">
          <Button onClick={reset}>再試行</Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            トップページへ
          </Button>
        </div>
      </div>
    </div>
  )
}


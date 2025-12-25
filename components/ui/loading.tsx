/**
 * 共通ローディングUI
 */

interface LoadingProps {
  message?: string
}

export function Loading({ message = "読み込み中..." }: LoadingProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-6 py-10 md:px-10">
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <div className="text-lg font-medium">{message}</div>
        </div>
      </div>
    </div>
  )
}


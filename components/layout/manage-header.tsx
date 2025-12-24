import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ManageHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card py-4 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">管理ページ</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/">閲覧ページへ</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}


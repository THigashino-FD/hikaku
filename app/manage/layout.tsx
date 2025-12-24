import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "管理ページ - NEUTRAL COMPARE",
  description: "CASEと画像を管理するページ。新規追加、編集、削除、並び替えなどの操作が可能です。",
}

export default function ManageLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}


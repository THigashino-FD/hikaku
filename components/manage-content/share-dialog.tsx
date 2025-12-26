"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { CaseRecord } from "@/lib/db"

interface ShareDialogProps {
  sharingCase: CaseRecord
  shareLink: string
  shareError: string
  onClose: () => void
  onCopyShareLink: () => Promise<void>
  onOpenImageLibrary: () => void
}

export function ShareDialog({
  sharingCase,
  shareLink,
  shareError,
  onClose,
  onCopyShareLink,
  onOpenImageLibrary,
}: ShareDialogProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-10 md:px-10">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-xl font-bold">共有リンク生成</h1>
        <Button variant="outline" onClick={onClose}>
          閉じる
        </Button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold">{sharingCase.title}</h2>
        {sharingCase.description && (
          <p className="mb-4 text-sm text-muted-foreground">{sharingCase.description}</p>
        )}

        {shareError && (
          <div className="mb-4 space-y-3">
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {shareError}
            </div>

            {shareError.includes("URL画像ではない") && (
              <div className="rounded-md bg-blue-50 p-5 text-sm">
                <h4 className="mb-3 flex items-center gap-2 font-bold text-blue-900">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  なぜ「URLから追加した画像」が必要なのですか？
                </h4>
                <div className="mb-4 space-y-2 text-blue-800">
                  <p>
                    <strong>【パソコンから追加した画像】</strong><br />
                    パソコンから追加した画像は、<strong>あなたのブラウザの中だけ</strong>に保存されます。
                    他の人のパソコンには存在しないため、共有リンクを送っても相手は画像を見ることができません。
                  </p>
                  <p>
                    <strong>【URL画像】</strong><br />
                    Google DriveやオンラインストレージのURLから追加した画像は、<strong>インターネット上</strong>にあります。
                    共有リンクにそのURLを含めることで、リンクを開いた相手も同じ画像を見ることができます。
                  </p>
                </div>

                <h4 className="mb-2 font-semibold text-blue-900">共有できるCASEの作り方（手順）</h4>
                <ol className="list-decimal space-y-2 pl-5 text-blue-800">
                  <li>
                    <strong>画像をGoogle Driveなどにアップロード</strong>して、共有設定を「リンクを知っている全員」に変更
                  </li>
                  <li>
                    <strong>画像ライブラリを編集</strong>ボタンをクリック
                  </li>
                  <li>
                    <strong>「URLから画像を追加」</strong>をクリックして、Before/After用の画像URLをそれぞれ追加
                  </li>
                  <li>
                    <strong>このCASEを編集</strong>して、Before/Afterに「URLから追加した画像」を割り当てて保存
                  </li>
                  <li>
                    <strong>再度「共有」ボタン</strong>をクリックすると、共有リンクが生成されます
                  </li>
                </ol>

                <div className="mt-4">
                  <Button
                    onClick={onOpenImageLibrary}
                    className="w-full gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    画像ライブラリを開いてURLから画像を追加する
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {shareLink && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">共有リンク</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={shareLink}
                  className="font-mono text-xs"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button onClick={onCopyShareLink}>
                  コピー
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-muted/50 p-4 text-sm">
              <h3 className="mb-2 font-semibold">共有方法</h3>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>上記のリンクをコピーして相手に送信</li>
                <li>相手がリンクを開くと、同じ表示が再現されます</li>
                <li>必要に応じて「共有CASEとして保存」ボタンで自分の環境に保存できます</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const Header = memo(function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-primary py-4 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10">
            <Image
              src="/branding/freedom-logo-mark-teal-on-white.png"
              alt="FREEDOM Logo Mark"
              width={40}
              height={40}
              priority
            />
          </div>
          <div className="h-6">
            <Image 
              src="/branding/freedom-architects-wordmark-black.png"
              alt="FREEDOM ARCHITECTS" 
              width={180} 
              height={22} 
              priority 
              className="brightness-0 invert"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-[10px] font-bold tracking-[0.2em] text-primary-foreground/60 md:block">
            RENOVATION REVIEW TOOL
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/manage">管理ページ</Link>
          </Button>
        </div>
      </div>
    </header>
  )
})


import Image from "next/image"

export function Footer() {
  return (
    <footer className="mt-20 bg-[#0b5560] py-14 text-white">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16">
              <Image
                src="/branding/freedom-logo-mark-white-on-teal.png"
                alt="FREEDOM Logo Mark"
                width={64}
                height={64}
                priority
              />
            </div>
          </div>
          <div className="text-[10px] tracking-[0.12em] text-white/70">
            COPYRIGHT ©FREEDOM ARCHITECTS ALL RIGHTS RESERVED.
          </div>
        </div>
      </div>
    </footer>
  )
}


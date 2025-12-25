import { notFound } from "next/navigation"

export default function E2EManageErrorPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  // 本番環境・通常アクセスでは露出させない（E2E専用）
  if (process.env.E2E_ROUTES !== "1" || searchParams?.force !== "1") {
    notFound()
  }

  throw new Error("E2E: forced error (manage)")
}



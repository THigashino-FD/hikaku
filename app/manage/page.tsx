import { ManageHeader } from "@/components/layout/manage-header"
import { ManageContent } from "@/components/manage-content"

export default function ManagePage() {
  return (
    <main className="min-h-screen bg-background">
      <ManageHeader />
      <ManageContent />
    </main>
  )
}



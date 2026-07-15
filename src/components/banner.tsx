"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Undo, Trash2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useSidebar } from "@/stores/use-sidebar"
import { ConfirmModal } from "@/components/confirm-modal"

interface BannerProps {
  documentId: string
  onRestore: () => void
}

export function Banner({ documentId, onRestore }: BannerProps) {
  const router = useRouter()
  const { refresh } = useSidebar()
  const [confirming, setConfirming] = useState(false)

  const handleDelete = async () => {
    setConfirming(false)
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        toast.error("Silme başarısız.")
        return
      }
      toast.success("Sayfa kalıcı olarak silindi.")
      refresh()
      router.push("/documents")
    } catch {
      toast.error("Silme başarısız.")
    }
  }

  return (
    <div className="flex w-full items-center justify-center gap-3 bg-destructive/90 px-4 py-2.5 text-sm text-destructive-foreground backdrop-blur-sm">
      <AlertTriangle className="h-4 w-4" />
      <p className="font-medium">Bu sayfa çöp kutusunda.</p>
      <button
        onClick={onRestore}
        className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/30"
      >
        <Undo className="h-3 w-3" />
        Geri Yükle
      </button>
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1 text-xs font-medium transition-colors hover:bg-white/20"
      >
        <Trash2 className="h-3 w-3" />
        Kalıcı Sil
      </button>

      {confirming && (
        <ConfirmModal
          message="Bu sayfayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          confirmLabel="Kalıcı Sil"
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}

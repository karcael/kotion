"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Search, Trash2, Undo, X } from "lucide-react"
import { toast } from "sonner"
import { useSidebar } from "@/stores/use-sidebar"
import { ConfirmModal } from "@/components/confirm-modal"

interface TrashDocument {
  id: string
  title: string
  icon: string | null
}

interface TrashBoxProps {
  onClose: () => void
}

export function TrashBox({ onClose }: TrashBoxProps) {
  const params = useParams()
  const router = useRouter()
  const { refresh } = useSidebar()
  const [documents, setDocuments] = useState<TrashDocument[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const fetchTrash = async () => {
    try {
      const res = await fetch("/api/documents?archived=true")
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Failed to fetch trash:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrash()
  }, [])

  // Escape ile kapat (onay modalı açıkken kapatma; onu ConfirmModal yönetir).
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmId) onClose()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onClose, confirmId])

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      })
      if (!res.ok) {
        toast.error("Geri yükleme başarısız.")
        return
      }
      toast.success("Sayfa geri yüklendi.")
      refresh()
      fetchTrash()
    } catch {
      toast.error("Geri yükleme başarısız.")
    }
  }

  const handleDelete = async (id: string) => {
    setConfirmId(null)
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" })
      if (!res.ok) {
        toast.error("Silme başarısız.")
        return
      }
      toast.success("Sayfa kalıcı olarak silindi.")
      // Silinen sayfa o an açıksa kullanıcıyı ölü sayfada bırakma.
      if (params?.documentId === id) {
        router.push("/documents")
      }
      refresh()
      fetchTrash()
    } catch {
      toast.error("Silme başarısız.")
    }
  }

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="animate-scale-in relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-popover shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h3 className="text-sm font-semibold">Çöp Kutusu</h3>
          <button
            onClick={onClose}
            aria-label="Çöp kutusunu kapat"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Silinen sayfaları ara..."
              className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto px-2 pb-3">
          {loading ? (
            <div className="space-y-1.5 px-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 animate-pulse rounded-lg bg-foreground/5"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center">
              <Trash2 className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">
                Çöp kutusu boş.
              </p>
            </div>
          ) : (
            filtered.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-foreground/[0.04]"
              >
                <span className="shrink-0 text-[15px]">
                  {doc.icon || "📄"}
                </span>
                <span className="flex-1 truncate">{doc.title}</span>
                <button
                  onClick={() => handleRestore(doc.id)}
                  aria-label="Geri yükle"
                  className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  title="Geri Yükle"
                >
                  <Undo className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setConfirmId(doc.id)}
                  aria-label="Kalıcı olarak sil"
                  className="cursor-pointer rounded-lg p-1.5 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Kalıcı Olarak Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmId && (
        <ConfirmModal
          message="Bu sayfayı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          confirmLabel="Kalıcı Sil"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

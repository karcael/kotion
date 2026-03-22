"use client"

import { useEffect, useState, useRef } from "react"
import { Search, X, ChevronRight } from "lucide-react"
import { PageIcon } from "./page-icon"

interface PageItem {
  id: string
  title: string
  icon: string | null
  parentId: string | null
}

interface PageLinkDialogProps {
  onSelect: (page: PageItem) => void
  onClose: () => void
}

export function PageLinkDialog({ onSelect, onClose }: PageLinkDialogProps) {
  const [query, setQuery] = useState("")
  const [pages, setPages] = useState<PageItem[]>([])
  const [filtered, setFiltered] = useState<PageItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Tüm sayfaları yükle (alt sayfalar dahil)
  useEffect(() => {
    fetch("/api/documents?all=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPages(data)
          setFiltered(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Filtrele
  useEffect(() => {
    if (!query.trim()) {
      setFiltered(pages)
    } else {
      const q = query.toLowerCase()
      setFiltered(pages.filter((p) => p.title.toLowerCase().includes(q)))
    }
    setSelectedIndex(0)
  }, [query, pages])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node))
        onClose()
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((p) => (p + 1) % Math.max(filtered.length, 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(
        (p) =>
          (p + Math.max(filtered.length, 1) - 1) %
          Math.max(filtered.length, 1)
      )
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      onSelect(filtered[selectedIndex])
    }
  }

  // Üst sayfa yolunu bul
  const getParentPath = (page: PageItem): string => {
    if (!page.parentId) return ""
    const parent = pages.find((p) => p.id === page.parentId)
    if (!parent) return ""
    const grandPath = getParentPath(parent)
    return grandPath ? `${grandPath} / ${parent.title}` : parent.title
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="animate-scale-in relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-popover shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h3 className="text-sm font-semibold">Sayfa Bağlantısı Ekle</h3>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-border/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sayfa ara..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto p-1.5">
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
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              {query ? "Sonuç bulunamadı" : "Henüz sayfa yok"}
            </p>
          ) : (
            filtered.map((page, index) => {
              const parentPath = getParentPath(page)
              return (
                <button
                  key={page.id}
                  onClick={() => onSelect(page)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    index === selectedIndex
                      ? "bg-accent/10 text-foreground"
                      : "text-foreground/80 hover:bg-foreground/[0.04]"
                  }`}
                >
                  <PageIcon icon={page.icon} size={16} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{page.title}</span>
                    {parentPath && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 truncate">
                        {parentPath}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

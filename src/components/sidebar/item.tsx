"use client"

import {
  ChevronRight,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { useSidebar } from "@/stores/use-sidebar"
import { PageIcon } from "@/components/page-icon"

interface ItemProps {
  id: string
  label: string
  icon?: string
  documentIcon?: LucideIcon
  active?: boolean
  level?: number
  hasChildren?: boolean
  expanded?: boolean
  onExpand?: () => void
  onClick?: () => void
  onCreate?: () => void
  isFavorite?: boolean
}

export function Item({
  id,
  label,
  icon,
  documentIcon: DocumentIcon,
  active,
  level = 0,
  hasChildren,
  expanded,
  onExpand,
  onClick,
  onCreate,
  isFavorite,
}: ItemProps) {
  const router = useRouter()
  const params = useParams()
  const { refresh } = useSidebar()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      })
      if (!res.ok) {
        toast.error("Sayfa çöp kutusuna taşınamadı.")
        return
      }
      refresh()
      // Yalnızca arşivlenen sayfa o an açıksa karşılama ekranına dön.
      if (params?.documentId === id) {
        router.push("/documents")
      }
    } catch (error) {
      console.error("Failed to archive:", error)
      toast.error("Sayfa çöp kutusuna taşınamadı.")
    }
  }

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(false)
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      })
      if (!res.ok) {
        toast.error("İşlem başarısız.")
        return
      }
      refresh()
    } catch (error) {
      console.error("Failed to toggle favorite:", error)
      toast.error("İşlem başarısız.")
    }
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      style={{ paddingLeft: `${8 + level * 14}px` }}
      className={`
        group relative flex w-full items-center rounded-lg py-[5px] pr-1.5 text-[13px] transition-colors
        ${
          active
            ? "bg-foreground/[0.06] font-medium text-foreground"
            : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
        }
      `}
    >
      <div className="relative mr-1.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        <span
          className={`flex items-center justify-center transition-opacity ${
            hasChildren ? "group-hover:opacity-0" : ""
          }`}
        >
          {icon ? (
            <PageIcon icon={icon} size={16} />
          ) : DocumentIcon ? (
            <DocumentIcon className="h-[15px] w-[15px] opacity-60" />
          ) : null}
        </span>
        {hasChildren && (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onExpand?.()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.stopPropagation()
                onExpand?.()
              }
            }}
            className="absolute inset-0 flex items-center justify-center rounded-md opacity-0 transition-all hover:bg-foreground/10 group-hover:opacity-100"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-150 ${
                expanded ? "rotate-90" : ""
              }`}
            />
          </div>
        )}
      </div>

      <span className="min-w-0 flex-1 truncate">{label}</span>

      <div className="ml-1 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            aria-label="Sayfa menüsü"
            className="rounded-md p-1 transition-colors hover:bg-foreground/10"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>

          {showMenu && (
            <div className="animate-scale-in absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-border/80 bg-popover p-1 shadow-xl">
              <button
                onClick={handleToggleFavorite}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors hover:bg-foreground/5"
              >
                <Star
                  className={`h-4 w-4 ${
                    isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                  }`}
                />
                {isFavorite ? "Favorilerden Kaldır" : "Favorilere Ekle"}
              </button>
              <button
                onClick={handleArchive}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Çöp Kutusuna Taşı
              </button>
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onCreate?.()
          }}
          aria-label="Alt sayfa ekle"
          className="rounded-md p-1 transition-colors hover:bg-foreground/10"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

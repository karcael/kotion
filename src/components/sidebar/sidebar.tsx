"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  ChevronsLeft,
  MenuIcon,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { Logo } from "@/components/logo"
import { useSidebar } from "@/stores/use-sidebar"
import { useSearch } from "@/stores/use-search"
import { DocumentList } from "./document-list"
import { InvitationList } from "./invitation-list"
import { SharedList } from "./shared-list"
import { UserItem } from "./user-item"
import { TrashBox } from "./trash-box"
import { useMediaQuery } from "@/hooks/use-media-query"

interface SidebarProps {
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
}

export function Sidebar({ user }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearch()
  const { isOpen, width, setWidth, setIsResizing, open, close, refresh } =
    useSidebar()

  const isResizingRef = useRef(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [showTrash, setShowTrash] = useState(false)

  useEffect(() => {
    if (isMobile) close()
  }, [pathname, isMobile, close])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizingRef.current) return
      let newWidth = e.clientX
      if (newWidth < 200) newWidth = 200
      if (newWidth > 480) newWidth = 480
      setWidth(newWidth)
    },
    [setWidth]
  )

  const handleMouseUp = useCallback(() => {
    isResizingRef.current = false
    setIsResizing(false)
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
  }, [setIsResizing, handleMouseMove])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizingRef.current = true
    setIsResizing(true)
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const handleCreateDocument = async () => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Adsız" }),
      })

      if (res.ok) {
        const doc = await res.json()
        refresh()
        router.push(`/documents/${doc.id}`)
      }
    } catch (error) {
      console.error("Failed to create document:", error)
    }
  }

  return (
    <>
      {/* Mobil arka plan */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          group/sidebar fixed left-0 top-0 z-50 flex h-full flex-col bg-sidebar
          transition-all duration-200 ease-out
          ${isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}
        `}
        style={{ width: isMobile ? 260 : width }}
      >
        {/* Üst bölüm: Logo + Daralt */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
            <Logo size={20} />
            <span>Kotion</span>
          </div>
          <button
            onClick={close}
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-foreground/5 hover:text-foreground group-hover/sidebar:opacity-100"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Kullanıcı */}
        <UserItem user={user} />

        {/* Aksiyonlar */}
        <div className="space-y-0.5 px-3 py-1">
          <button
            onClick={search.open}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            <span>Ara</span>
            <kbd className="ml-auto rounded-md border border-border/80 bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={handleCreateDocument}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Sayfa</span>
          </button>
        </div>

        {/* Ayırıcı */}
        <div className="mx-3 my-2 h-px bg-border/60" />

        {/* Davetler */}
        <InvitationList />

        {/* Favoriler */}
        <div className="mt-1">
          <p className="px-5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Favoriler
          </p>
          <DocumentList type="favorites" />
        </div>

        {/* Sayfalar */}
        <div className="mt-3 flex-1 overflow-y-auto">
          <p className="px-5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Not Sayfaları
          </p>
          <DocumentList type="all" />

          {/* Paylaşılanlar */}
          <SharedList />
        </div>

        {/* Sürüm bilgisi */}
        <div className="px-5 py-1.5">
          <span className="text-[10px] font-medium tracking-wider text-muted-foreground/40">
            Kotion v1.3
          </span>
        </div>

        {/* Çöp kutusu */}
        <div className="border-t border-border/60 px-3 py-2">
          <button
            onClick={() => setShowTrash(true)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
            <span>Çöp Kutusu</span>
          </button>
        </div>

        {/* Boyutlandırma tutamacı */}
        {!isMobile && (
          <div
            onMouseDown={handleMouseDown}
            className="absolute right-0 top-0 h-full w-[3px] cursor-col-resize bg-transparent transition-colors hover:bg-accent/40"
          />
        )}
      </aside>

      {/* Mobil açma butonu */}
      {!isOpen && (
        <div className="fixed left-4 top-3.5 z-50">
          <button
            onClick={open}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Çöp kutusu */}
      {showTrash && <TrashBox onClose={() => setShowTrash(false)} />}
    </>
  )
}

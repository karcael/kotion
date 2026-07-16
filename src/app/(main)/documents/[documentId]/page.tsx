"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Toolbar } from "@/components/toolbar"
import { Cover } from "@/components/cover"
import { Banner } from "@/components/banner"
import { Breadcrumb } from "@/components/breadcrumb"
import { Editor } from "@/components/editor/editor"
import { Spinner } from "@/components/spinner"
import { useSidebar } from "@/stores/use-sidebar"
import { useSession } from "@/stores/use-session"
import { toast } from "sonner"

interface Crumb {
  id: string
  title: string
  icon: string | null
}

interface Document {
  id: string
  title: string
  content: unknown
  icon: string | null
  coverImage: string | null
  isArchived: boolean
  isFavorite: boolean
  isPublished: boolean
  role?: string
  ancestors?: Crumb[]
}

export default function DocumentPage() {
  const params = useParams()
  const router = useRouter()
  const refreshRef = useRef(useSidebar.getState().refresh)
  refreshRef.current = useSidebar.getState().refresh
  const setSessionExpired = useSession((s) => s.setSessionExpired)
  const sessionExpired = useSession((s) => s.sessionExpired)
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const latestContentRef = useRef<unknown>(null)
  const documentId = params?.documentId as string

  useEffect(() => {
    if (!documentId) return

    setLoading(true)
    fetch(`/api/documents/${documentId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found")
        return res.json()
      })
      .then(async (data) => {
        // Check localStorage for recovered content from an expired session.
        const recoveryKey = `kotion-recovery-${documentId}`
        let recovered: unknown = null
        try {
          const recoveryData = localStorage.getItem(recoveryKey)
          if (recoveryData) recovered = JSON.parse(recoveryData)
        } catch {
          localStorage.removeItem(recoveryKey)
        }

        if (recovered) {
          // Persist recovered content to the server first, then open the editor
          // with it. Only drop the local copy once the save succeeds so nothing
          // is lost if the request fails (it is retried on the next open).
          try {
            const res = await fetch(`/api/documents/${documentId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ content: recovered }),
              // Hung bir ağda editörün spinner'da takılı kalmaması için sınırla.
              signal: AbortSignal.timeout(10000),
            })
            if (res.ok) {
              data.content = recovered
              latestContentRef.current = recovered
              localStorage.removeItem(recoveryKey)
              toast.success("Kaydedilmemiş değişiklikler kurtarıldı.")
            }
          } catch {
            // Network error: keep the local copy for the next attempt.
          }
        }

        setDocument(data)
        setLoading(false)
      })
      .catch(() => {
        router.push("/documents")
      })
  }, [documentId, router])

  // Sekme başlığını güncelle
  useEffect(() => {
    if (document) {
      window.document.title = `${document.title || "Adsız"} - Kotion`
    }
    return () => {
      window.document.title = "Kotion"
    }
  }, [document?.title])

  const updateDocument = useCallback(
    async (updates: Partial<Document>): Promise<boolean> => {
      if (!documentId) return false

      const needsRefresh =
        "title" in updates ||
        "icon" in updates ||
        "isArchived" in updates ||
        "isFavorite" in updates

      setDocument((prev) => (prev ? { ...prev, ...updates } : null))

      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        if (res.status === 401) {
          setSessionExpired(true)
          return false
        }
        if (!res.ok) {
          // Shared id keeps repeated debounced-save failures from stacking toasts.
          toast.error("Değişiklikler kaydedilemedi.", {
            id: "document-save-error",
          })
          return false
        }
        if (needsRefresh) {
          refreshRef.current()
          if ("title" in updates) {
            useSidebar.getState().clearTitleOverride(documentId)
          }
        }
        return true
      } catch (error) {
        console.error("Failed to update document:", error)
        toast.error("Değişiklikler kaydedilemedi.", {
          id: "document-save-error",
        })
        return false
      }
    },
    [documentId, setSessionExpired]
  )

  const handleContentChange = useCallback(
    (content: unknown) => {
      latestContentRef.current = content
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        updateDocument({ content })
        // Debounce ateşlendi; artık bekleyen kayıt yok. Bunu işaretlemek
        // unmount/beforeunload flush'larının zaten kaydedilmiş içeriği yeniden
        // yazmasını (ve iş birliğinde uzak düzenlemeyi ezmesini) önler.
        saveTimeoutRef.current = null
      }, 1000)
    },
    [updateDocument]
  )

  // Ctrl+S / Cmd+S: save immediately, bypass debounce
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }
        if (latestContentRef.current) {
          const ok = await updateDocument({ content: latestContentRef.current })
          if (ok) toast.success("Kaydedildi.")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [updateDocument])

  // Flush pending content when the tab is closed or reloaded (keepalive lets the
  // request complete during unload).
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current && latestContentRef.current && documentId) {
        fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: latestContentRef.current }),
          keepalive: true,
        }).catch(() => {})
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [documentId])

  // Save content to localStorage when session expires (recovery mechanism)
  useEffect(() => {
    if (sessionExpired && latestContentRef.current && documentId) {
      try {
        const recoveryKey = `kotion-recovery-${documentId}`
        localStorage.setItem(
          recoveryKey,
          JSON.stringify(latestContentRef.current)
        )
      } catch {
        // localStorage full or unavailable - nothing we can do
      }
    }
  }, [sessionExpired, documentId])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
        // Flush pending debounced content on unmount / document switch so the
        // last edits are not dropped. No keepalive here: this is an SPA
        // navigation (the page is not unloading), so a normal fetch completes
        // and is not subject to the keepalive body-size limit.
        if (latestContentRef.current && documentId) {
          fetch(`/api/documents/${documentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: latestContentRef.current }),
          }).catch(() => {})
        }
      }
    }
  }, [documentId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!document) return null

  return (
    <div className="pb-40">
      {document.isArchived && (
        <Banner
          documentId={document.id}
          onRestore={() => updateDocument({ isArchived: false })}
        />
      )}

      {document.coverImage && (
        <Cover
          url={document.coverImage}
          onRemove={() => updateDocument({ coverImage: null })}
        />
      )}

      <div className="mx-auto max-w-4xl px-4 md:px-8 lg:px-12">
        <Breadcrumb
          ancestors={document.ancestors ?? []}
          current={{ title: document.title, icon: document.icon }}
        />
        <Toolbar
          document={document}
          content={document.content}
          onUpdate={updateDocument}
          isOwner={document.role === "OWNER"}
        />
        <Editor
          documentId={documentId}
          initialContent={document.content}
          onChange={handleContentChange}
          onRemoteUpdate={(content) => {
            latestContentRef.current = content
          }}
          editable={!document.isArchived && document.role !== "VIEWER"}
        />
      </div>
    </div>
  )
}

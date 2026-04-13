"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Toolbar } from "@/components/toolbar"
import { Cover } from "@/components/cover"
import { Banner } from "@/components/banner"
import { Editor } from "@/components/editor/editor"
import { Spinner } from "@/components/spinner"
import { useSidebar } from "@/stores/use-sidebar"
import { useSession } from "@/stores/use-session"
import { toast } from "sonner"

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
      .then((data) => {
        // Check localStorage for recovered content from an expired session
        const recoveryKey = `kotion-recovery-${documentId}`
        let hasRecovery = false
        try {
          const recoveryData = localStorage.getItem(recoveryKey)
          if (recoveryData) {
            const recovered = JSON.parse(recoveryData)
            data.content = recovered
            hasRecovery = true
            localStorage.removeItem(recoveryKey)
            toast.success("Kaydedilmemiş değişiklikler kurtarıldı.")
          }
        } catch {
          localStorage.removeItem(recoveryKey)
        }
        setDocument(data)
        setLoading(false)

        // Save recovered content to server
        if (hasRecovery) {
          fetch(`/api/documents/${documentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: data.content }),
          }).catch(() => {
            // Will be saved on next edit
          })
        }
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
    async (updates: Partial<Document>) => {
      if (!documentId) return

      if (
        "title" in updates ||
        "icon" in updates ||
        "isArchived" in updates ||
        "isFavorite" in updates
      ) {
        refreshRef.current()
      }

      setDocument((prev) => (prev ? { ...prev, ...updates } : null))

      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        if (res.status === 401) {
          setSessionExpired(true)
        }
      } catch (error) {
        console.error("Failed to update document:", error)
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
      }, 1000)
    },
    [updateDocument]
  )

  // Ctrl+S / Cmd+S: save immediately, bypass debounce
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }
        if (latestContentRef.current) {
          updateDocument({ content: latestContentRef.current })
          toast.success("Kaydedildi.")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [updateDocument])

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
      }
    }
  }, [])

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
        <Toolbar document={document} onUpdate={updateDocument} />
        <Editor
          documentId={documentId}
          initialContent={document.content}
          onChange={handleContentChange}
          editable={!document.isArchived && document.role !== "VIEWER"}
        />
      </div>
    </div>
  )
}

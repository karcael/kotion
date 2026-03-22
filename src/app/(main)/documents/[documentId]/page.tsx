"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Toolbar } from "@/components/toolbar"
import { Cover } from "@/components/cover"
import { Banner } from "@/components/banner"
import { Editor } from "@/components/editor/editor"
import { Spinner } from "@/components/spinner"
import { useSidebar } from "@/stores/use-sidebar"

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
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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
        await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
      } catch (error) {
        console.error("Failed to update document:", error)
      }
    },
    [documentId]
  )

  const handleContentChange = useCallback(
    (content: unknown) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        updateDocument({ content })
      }, 1000)
    },
    [updateDocument]
  )

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

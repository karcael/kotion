"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { FileIcon } from "lucide-react"
import { Item } from "./item"
import { useSidebar } from "@/stores/use-sidebar"

interface Document {
  id: string
  title: string
  icon: string | null
  parentId: string | null
  isFavorite: boolean
  _count: { children: number }
}

interface DocumentListProps {
  type: "all" | "favorites"
  parentId?: string
  level?: number
}

export function DocumentList({
  type,
  parentId,
  level = 0,
}: DocumentListProps) {
  const params = useParams()
  const router = useRouter()
  const { refreshKey, refresh } = useSidebar()
  const [documents, setDocuments] = useState<Document[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // Sürükle-bırak state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        let url = "/api/documents?"
        if (type === "favorites") {
          url += "favorites=true"
        } else if (parentId) {
          url += `parentId=${parentId}`
        }

        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          setDocuments(data)
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [parentId, type, refreshKey])

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleCreate = async (docParentId: string) => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Adsız", parentId: docParentId }),
      })

      if (res.ok) {
        const doc = await res.json()
        setExpanded((prev) => ({ ...prev, [docParentId]: true }))
        refresh()
        router.push(`/documents/${doc.id}`)
      }
    } catch (error) {
      console.error("Failed to create document:", error)
    }
  }

  // Sıralama kaydet
  const saveOrder = useCallback(
    async (newDocs: Document[]) => {
      try {
        await fetch("/api/documents/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderedIds: newDocs.map((d) => d.id),
          }),
        })
        refresh()
      } catch (error) {
        console.error("Failed to save order:", error)
      }
    },
    [refresh]
  )

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setDropIndex(index)
  }

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDropIndex(null)
      return
    }

    const newDocs = [...documents]
    const [moved] = newDocs.splice(dragIndex, 1)
    newDocs.splice(index, 0, moved)
    setDocuments(newDocs)
    saveOrder(newDocs)
    setDragIndex(null)
    setDropIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDropIndex(null)
  }

  if (loading && level === 0) {
    return (
      <div className="px-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="my-1 h-7 animate-pulse rounded-sm bg-foreground/5"
          />
        ))}
      </div>
    )
  }

  if (documents.length === 0 && level === 0) {
    return (
      <p className="px-5 py-2 text-xs text-muted-foreground">
        {type === "favorites" ? "Favori sayfa yok" : "Sayfa yok"}
      </p>
    )
  }

  return (
    <div className="px-3">
      {documents.map((doc, index) => (
        <div
          key={doc.id}
          draggable={type === "all"}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={() => handleDrop(index)}
          onDragEnd={handleDragEnd}
          className={`${
            dragIndex === index ? "opacity-40" : ""
          } ${
            dropIndex === index && dragIndex !== null
              ? "border-t-2 border-accent"
              : ""
          }`}
        >
          <Item
            id={doc.id}
            label={doc.title}
            icon={doc.icon || undefined}
            documentIcon={!doc.icon ? FileIcon : undefined}
            active={params?.documentId === doc.id}
            level={level}
            hasChildren={doc._count.children > 0}
            expanded={expanded[doc.id]}
            onExpand={() => toggleExpand(doc.id)}
            onClick={() => router.push(`/documents/${doc.id}`)}
            onCreate={() => handleCreate(doc.id)}
            isFavorite={doc.isFavorite}
          />
          {expanded[doc.id] && (
            <DocumentList type={type} parentId={doc.id} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  )
}

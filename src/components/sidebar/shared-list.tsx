"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Users } from "lucide-react"
import { useSidebar } from "@/stores/use-sidebar"
import { PageIcon } from "@/components/page-icon"

interface SharedDocument {
  id: string
  title: string
  icon: string | null
  role: string
  ownerName: string
}

export function SharedList() {
  const params = useParams()
  const router = useRouter()
  const { refreshKey } = useSidebar()
  const [documents, setDocuments] = useState<SharedDocument[]>([])

  useEffect(() => {
    fetch("/api/documents?shared=true")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDocuments(data)
      })
      .catch(() => {})
  }, [refreshKey])

  if (documents.length === 0) return null

  return (
    <div className="mt-2">
      <p className="px-5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        <Users className="mr-1 inline h-3 w-3" />
        Paylaşılanlar
      </p>
      <div className="px-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => router.push(`/documents/${doc.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && router.push(`/documents/${doc.id}`)
            }
            className={`flex items-center gap-2 rounded-lg px-3 py-[5px] text-[13px] transition-colors cursor-pointer ${
              params?.documentId === doc.id
                ? "bg-foreground/[0.06] font-medium text-foreground"
                : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
            }`}
          >
            <PageIcon icon={doc.icon} size={15} />
            <div className="flex-1 min-w-0">
              <span className="block truncate">{doc.title}</span>
            </div>
            <span className="text-[10px] text-muted-foreground/50">
              {doc.ownerName}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

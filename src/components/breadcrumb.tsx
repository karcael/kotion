"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { PageIcon } from "@/components/page-icon"

interface Crumb {
  id: string
  title: string
  icon: string | null
}

interface BreadcrumbProps {
  ancestors: Crumb[]
  current: { title: string; icon: string | null }
}

export function Breadcrumb({ ancestors, current }: BreadcrumbProps) {
  // Collapse the middle when the trail is long: root, …, last ancestor, current.
  let shown = ancestors
  let collapsed = false
  if (ancestors.length > 3) {
    shown = [ancestors[0], ancestors[ancestors.length - 1]]
    collapsed = true
  }

  return (
    <nav aria-label="Sayfa yolu" className="flex items-center gap-1 pt-6 text-xs text-muted-foreground">
      <Link href="/documents" className="cursor-pointer rounded px-1 py-0.5 hover:bg-foreground/5 hover:text-foreground">
        Notlar
      </Link>
      {shown.map((crumb, i) => (
        <span key={crumb.id} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 opacity-50" />
          {collapsed && i === 1 && (
            <>
              <span className="px-0.5">…</span>
              <ChevronRight className="h-3 w-3 opacity-50" />
            </>
          )}
          <Link
            href={`/documents/${crumb.id}`}
            className="flex max-w-[160px] cursor-pointer items-center gap-1 truncate rounded px-1 py-0.5 hover:bg-foreground/5 hover:text-foreground"
          >
            <PageIcon icon={crumb.icon} size={12} />
            <span className="truncate">{crumb.title || "Adsız"}</span>
          </Link>
        </span>
      ))}
      <ChevronRight className="h-3 w-3 opacity-50" />
      <span className="flex max-w-[200px] items-center gap-1 truncate px-1 font-medium text-foreground">
        <PageIcon icon={current.icon} size={12} />
        <span className="truncate">{current.title || "Adsız"}</span>
      </span>
    </nav>
  )
}

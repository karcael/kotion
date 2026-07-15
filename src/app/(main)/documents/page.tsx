"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, FileText } from "lucide-react"
import { toast } from "sonner"
import { useSidebar } from "@/stores/use-sidebar"
import { Logo } from "@/components/logo"
import {
  templates,
  categoryLabels,
  type Template,
  type TemplateCategory,
} from "@/lib/templates"

const allCategories = Object.keys(categoryLabels) as TemplateCategory[]

export default function DocumentsPage() {
  const router = useRouter()
  const refreshRef = { current: useSidebar.getState().refresh }
  const [creating, setCreating] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<
    TemplateCategory | "all"
  >("all")

  const filtered =
    activeCategory === "all"
      ? templates
      : templates.filter((t) => t.category === activeCategory)

  const handleCreate = async (template?: Template) => {
    const id = template?.id ?? "__blank__"
    if (creating) return
    setCreating(id)

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template?.name ?? "Adsız",
          ...(template ? { content: template.content, icon: template.icon } : {}),
        }),
      })

      if (!res.ok) {
        toast.error("Sayfa oluşturulamadı.")
        return
      }
      const doc = await res.json()
      refreshRef.current()
      router.push(`/documents/${doc.id}`)
    } catch (error) {
      console.error("Failed to create document:", error)
      toast.error("Sayfa oluşturulamadı.")
    } finally {
      setCreating(null)
    }
  }

  return (
    <div className="flex h-full flex-col animate-fade-in overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex justify-center opacity-40">
            <Logo size={56} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Kotion&apos;a Hoş Geldiniz
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Notlarınızı, fikirlerinizi ve projelerinizi tek bir yerde organize
            edin.
          </p>

          {/* Blank page button */}
          <button
            onClick={() => handleCreate()}
            disabled={creating !== null}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {creating === "__blank__" ? "Oluşturuluyor..." : "Boş Sayfa Oluştur"}
          </button>
        </div>

        {/* Templates section */}
        <div>
          <div className="mb-5 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Taslaklar</h3>
          </div>

          {/* Category filters */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === "all"
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              Tümü
            </button>
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((template) => (
              <button
                key={template.id}
                onClick={() => handleCreate(template)}
                disabled={creating !== null}
                className="group flex flex-col items-start rounded-xl border border-border/60 bg-card p-4 text-left transition-all duration-200 hover:border-accent/40 hover:bg-accent/5 hover:shadow-md hover:shadow-accent/5 active:scale-[0.98] disabled:opacity-50"
              >
                <span className="mb-2 text-2xl">{template.icon}</span>
                <span className="text-sm font-medium group-hover:text-accent">
                  {creating === template.id ? "Oluşturuluyor..." : template.name}
                </span>
                <span className="mt-1 text-xs leading-snug text-muted-foreground">
                  {template.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

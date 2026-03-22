"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { PageIcon } from "@/components/page-icon"
import { useSearch } from "@/stores/use-search"
import { useDebounce } from "@/hooks/use-debounce"

interface SearchResult {
  id: string
  title: string
  icon: string | null
  parentId: string | null
}

export function SearchCommand() {
  const router = useRouter()
  const { isOpen, close } = useSearch()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        useSearch.getState().toggle()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      return
    }

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data)
        setSelectedIndex(0)
      })
      .catch(console.error)
  }, [debouncedQuery])

  useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setResults([])
    }
  }, [isOpen])

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`/documents/${id}`)
      close()
    },
    [router, close]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(results.length, 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(
        (prev) =>
          (prev + Math.max(results.length, 1) - 1) %
          Math.max(results.length, 1)
      )
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex].id)
    } else if (e.key === "Escape") {
      close()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={close}
      />
      <div className="animate-scale-in relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border/50 bg-popover shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sayfa ara..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            autoFocus
          />
          <kbd className="rounded-lg border border-border/80 bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-1.5">
          {results.length === 0 && query && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Sonuç bulunamadı
            </p>
          )}
          {!query && (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aramak için yazmaya başlayın...
            </p>
          )}
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-accent/10 text-foreground"
                  : "text-foreground/80 hover:bg-foreground/[0.04]"
              }`}
            >
              <PageIcon icon={result.icon} size={16} />
              <span className="truncate">{result.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

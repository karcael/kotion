"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Upload, Link2, Loader2, X, ImageIcon } from "lucide-react"

interface ImageUploadDialogProps {
  onSelect: (url: string) => void
  onClose: () => void
  title?: string
}

export function ImageUploadDialog({
  onSelect,
  onClose,
  title = "Görsel Ekle",
}: ImageUploadDialogProps) {
  const [tab, setTab] = useState<"upload" | "url">("upload")
  const [url, setUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState("")
  const dialogRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [onClose])

  const handleFileUpload = useCallback(
    async (file: File) => {
      setError("")

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ]
      if (!allowedTypes.includes(file.type)) {
        setError("Sadece JPEG, PNG, GIF ve WebP desteklenir.")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Dosya boyutu 5MB'dan büyük olamaz.")
        return
      }

      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (res.ok) {
          const data = await res.json()
          onSelect(data.url)
        } else {
          const data = await res.json()
          setError(data.error || "Yükleme başarısız.")
        }
      } catch {
        setError("Yükleme sırasında bir hata oluştu.")
      } finally {
        setUploading(false)
      }
    },
    [onSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileUpload(file)
    },
    [handleFileUpload]
  )

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    onSelect(url.trim())
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="animate-scale-in relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-popover shadow-2xl"
      >
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sekmeler */}
        <div className="flex border-b border-border/60">
          <button
            onClick={() => {
              setTab("upload")
              setError("")
            }}
            className={`flex-1 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              tab === "upload"
                ? "border-b-2 border-accent text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Upload className="mr-1.5 inline h-3.5 w-3.5" />
            Dosya Yükle
          </button>
          <button
            onClick={() => {
              setTab("url")
              setError("")
            }}
            className={`flex-1 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              tab === "url"
                ? "border-b-2 border-accent text-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="mr-1.5 inline h-3.5 w-3.5" />
            URL ile Ekle
          </button>
        </div>

        {/* İçerik */}
        <div className="p-5">
          {error && (
            <div className="mb-3 animate-slide-down rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          {tab === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-10 transition-all ${
                dragOver
                  ? "border-accent bg-accent/5"
                  : "border-border/80 hover:border-accent/50 hover:bg-foreground/[0.02]"
              }`}
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              ) : (
                <>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                    <ImageIcon
                      className="h-6 w-6 text-accent"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-sm font-medium">
                    Tıklayın veya sürükleyin
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, GIF, WebP (maks 5MB)
                  </p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
            </div>
          )}

          {tab === "url" && (
            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://ornek.com/gorsel.png"
                autoFocus
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="submit"
                disabled={!url.trim()}
                className="w-full cursor-pointer rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Görseli Ekle
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

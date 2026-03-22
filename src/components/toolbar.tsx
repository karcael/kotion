"use client"

import { useState } from "react"
import { ImageIcon, Smile, X, Upload, Share2 } from "lucide-react"
import { IconPicker } from "./icon-picker"
import { ImageUploadDialog } from "./image-upload-dialog"
import { ShareDialog } from "./share-dialog"
import { Title } from "./title"

interface ToolbarProps {
  document: {
    id: string
    title: string
    icon: string | null
    coverImage: string | null
  }
  onUpdate: (updates: Record<string, unknown>) => void
}

function isImageUrl(icon: string | null): boolean {
  if (!icon) return false
  return icon.startsWith("/") || icon.startsWith("http")
}

export function Toolbar({ document, onUpdate }: ToolbarProps) {
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [showIconImageUpload, setShowIconImageUpload] = useState(false)
  const [showCoverUpload, setShowCoverUpload] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)

  return (
    <div className="relative pb-4 pt-10">
      {/* Paylaş butonu — sağ üst, her zaman görünür */}
      <button
        onClick={() => setShowShareDialog(true)}
        className="absolute right-0 top-10 z-10 flex cursor-pointer items-center gap-1.5 rounded-xl bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:bg-accent/20 active:scale-95"
      >
        <Share2 className="h-3.5 w-3.5" />
        Paylaş
      </button>

      <div className="group relative">
        {/* Sayfa ikonu (emoji veya görsel) */}
        {document.icon ? (
          <div className="group/icon relative mb-4 inline-block">
            {isImageUrl(document.icon) ? (
              <button
                onClick={() => setShowIconImageUpload(true)}
                className="block overflow-hidden rounded-2xl transition-transform duration-150 hover:scale-105 active:scale-95"
              >
                <img
                  src={document.icon}
                  alt="Sayfa ikonu"
                  className="h-[72px] w-[72px] object-cover"
                />
              </button>
            ) : (
              <button
                onClick={() => setShowIconPicker(true)}
                className="text-6xl transition-transform duration-150 hover:scale-110 active:scale-95"
              >
                {document.icon}
              </button>
            )}
            <button
              onClick={() => onUpdate({ icon: null })}
              className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-popover text-muted-foreground shadow-md opacity-0 transition-all hover:text-foreground group-hover/icon:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}

        {/* Hover aksiyonları */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {!document.icon && (
            <>
              <button
                onClick={() => setShowIconPicker(true)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <Smile className="h-3.5 w-3.5" />
                <span>Emoji İkon</span>
              </button>
              <button
                onClick={() => setShowIconImageUpload(true)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Görsel İkon</span>
              </button>
            </>
          )}
          {!document.coverImage && (
            <button
              onClick={() => setShowCoverUpload(true)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              <span>Kapak Ekle</span>
            </button>
          )}
        </div>
      </div>

      <Title
        initialTitle={document.title}
        onChange={(title) => onUpdate({ title })}
      />

      {/* Emoji ikon seçici */}
      {showIconPicker && (
        <IconPicker
          onSelect={(icon) => {
            onUpdate({ icon: icon || null })
            setShowIconPicker(false)
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {/* Görsel ikon yükleme */}
      {showIconImageUpload && (
        <ImageUploadDialog
          title="Görsel İkon Yükle"
          onSelect={(url) => {
            onUpdate({ icon: url })
            setShowIconImageUpload(false)
          }}
          onClose={() => setShowIconImageUpload(false)}
        />
      )}

      {/* Kapak görseli yükleme */}
      {showCoverUpload && (
        <ImageUploadDialog
          title="Kapak Görseli Ekle"
          onSelect={(url) => {
            onUpdate({ coverImage: url })
            setShowCoverUpload(false)
          }}
          onClose={() => setShowCoverUpload(false)}
        />
      )}

      {/* Paylaşım dialogu */}
      {showShareDialog && (
        <ShareDialog
          documentId={document.id}
          onClose={() => setShowShareDialog(false)}
        />
      )}
    </div>
  )
}

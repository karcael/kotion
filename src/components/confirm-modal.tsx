"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

interface ConfirmModalProps {
  message: string
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * In-app confirmation dialog used in place of the browser's window.confirm.
 * Closes on Escape and on backdrop click.
 */
export function ConfirmModal({
  message,
  title = "Emin misiniz?",
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="animate-scale-in relative z-10 w-full max-w-sm rounded-2xl border border-border/50 bg-popover p-5 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">{title}</h4>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            autoFocus
            className="cursor-pointer rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-all hover:brightness-110 active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

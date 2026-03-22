"use client"

import { useEffect, useState } from "react"
import {
  X,
  UserPlus,
  Trash2,
  Pencil,
  Eye,
  Loader2,
  ChevronDown,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"

interface ShareDialogProps {
  documentId: string
  onClose: () => void
}

interface CollaboratorInfo {
  id: string
  userId: string
  name: string
  email: string
  role: "EDITOR" | "VIEWER"
}

interface PendingInvitation {
  id: string
  email: string
  role: "EDITOR" | "VIEWER"
  status: string
}

// Onay modal bileşeni
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="animate-scale-in relative z-10 w-full max-w-sm rounded-2xl border border-border/50 bg-popover p-5 shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Emin misiniz?</h4>
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
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Kaldır
          </button>
        </div>
      </div>
    </div>
  )
}

// Özel rol seçici
function RoleSelect({
  value,
  onChange,
}: {
  value: "EDITOR" | "VIEWER"
  onChange: (v: "EDITOR" | "VIEWER") => void
}) {
  const [open, setOpen] = useState(false)

  const options = [
    { value: "EDITOR" as const, label: "Düzenleyici", icon: Pencil, desc: "Görüntüleyebilir ve düzenleyebilir" },
    { value: "VIEWER" as const, label: "İzleyici", icon: Eye, desc: "Sadece görüntüleyebilir" },
  ]

  const selected = options.find((o) => o.value === value)!

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium transition-all hover:border-accent/50 hover:bg-foreground/[0.02]"
      >
        <selected.icon className="h-3.5 w-3.5 text-muted-foreground" />
        {selected.label}
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="animate-slide-down absolute right-0 top-full z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-border/50 bg-popover p-1 shadow-xl">
            {options.map((opt) => {
              const Icon = opt.icon
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "bg-accent/10 text-foreground"
                      : "text-foreground/80 hover:bg-foreground/[0.04]"
                  }`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isSelected ? "text-accent" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-[13px] font-medium">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export function ShareDialog({ documentId, onClose }: ShareDialogProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR")
  const [sending, setSending] = useState(false)
  const [collaborators, setCollaborators] = useState<CollaboratorInfo[]>([])
  const [pending, setPending] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState<{
    message: string
    action: () => void
  } | null>(null)

  const fetchCollaborators = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`)
      if (res.ok) {
        const data = await res.json()
        setCollaborators(data.collaborators)
        setPending(data.pendingInvitations)
      }
    } catch (error) {
      console.error("Failed to fetch collaborators:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollaborators()
  }, [documentId])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setSending(true)
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, email: email.trim(), role }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Davet gönderilemedi")
        return
      }

      toast.success(`${email} adresine davet gönderildi`)
      setEmail("")
      fetchCollaborators()
    } catch {
      toast.error("Davet gönderilirken hata oluştu")
    } finally {
      setSending(false)
    }
  }

  const handleRemove = (userId: string, name: string) => {
    setConfirmAction({
      message: `${name} kişisini bu nottan kaldırmak istediğinize emin misiniz?`,
      action: async () => {
        try {
          const res = await fetch(
            `/api/documents/${documentId}/collaborators?userId=${userId}`,
            { method: "DELETE" }
          )
          if (res.ok) {
            toast.success(`${name} kaldırıldı`)
            fetchCollaborators()
          }
        } catch {
          toast.error("Kaldırma başarısız")
        }
        setConfirmAction(null)
      },
    })
  }

  const handleCancelInvitation = (invitationId: string, invEmail: string) => {
    setConfirmAction({
      message: `${invEmail} adresine gönderilen daveti iptal etmek istediğinize emin misiniz?`,
      action: async () => {
        try {
          const res = await fetch(`/api/invitations/${invitationId}`, {
            method: "DELETE",
          })
          if (res.ok) {
            toast.success(`${invEmail} daveti iptal edildi`)
            fetchCollaborators()
          }
        } catch {
          toast.error("İptal başarısız")
        }
        setConfirmAction(null)
      },
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh]">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
        <div className="animate-scale-in relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-popover shadow-2xl">
          {/* Başlık */}
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
            <h3 className="text-sm font-semibold">Not Sayfasını Paylaş</h3>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Davet formu */}
          <form onSubmit={handleInvite} className="border-b border-border/60 p-4">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Posta Adresi"
                required
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <RoleSelect value={role} onChange={setRole} />
            </div>
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Davet Gönder
                </>
              )}
            </button>
          </form>

          {/* İşbirlikçiler ve bekleyen davetler */}
          <div className="max-h-64 overflow-y-auto p-3">
            {loading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-foreground/5"
                  />
                ))}
              </div>
            ) : (
              <>
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-foreground/[0.03]"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                      {collab.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {collab.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {collab.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {collab.role === "EDITOR" ? (
                          <>
                            <Pencil className="h-3 w-3" /> Düzenleyici
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" /> İzleyici
                          </>
                        )}
                      </span>
                      <button
                        onClick={() => handleRemove(collab.userId, collab.name)}
                        className="cursor-pointer rounded-lg p-1 text-destructive/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {pending.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 opacity-60"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                      ?
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px]">{inv.email}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Davet bekleniyor...
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {inv.role === "EDITOR" ? "Düzenleyici" : "İzleyici"}
                      </span>
                      <button
                        onClick={() =>
                          handleCancelInvitation(inv.id, inv.email)
                        }
                        title="Daveti iptal et"
                        className="cursor-pointer rounded-lg p-1 text-destructive/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {collaborators.length === 0 && pending.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Henüz kimseyle paylaşılmadı.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Onay modal'ı */}
      {confirmAction && (
        <ConfirmModal
          message={confirmAction.message}
          onConfirm={confirmAction.action}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </>
  )
}

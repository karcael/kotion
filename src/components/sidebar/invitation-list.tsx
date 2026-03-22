"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X, Mail } from "lucide-react"
import { toast } from "sonner"
import { useSidebar } from "@/stores/use-sidebar"
import { PageIcon } from "@/components/page-icon"

interface Invitation {
  id: string
  email: string
  role: string
  document: { id: string; title: string; icon: string | null }
  inviter: { name: string; email: string }
}

export function InvitationList() {
  const router = useRouter()
  const { refresh } = useSidebar()
  const [invitations, setInvitations] = useState<Invitation[]>([])

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/invitations")
      if (res.ok) {
        const data = await res.json()
        setInvitations(data)
      }
    } catch {
      // sessiz hata
    }
  }

  useEffect(() => {
    fetchInvitations()
    // Her 30 saniyede kontrol et
    const interval = setInterval(fetchInvitations, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRespond = async (id: string, status: "ACCEPTED" | "DECLINED") => {
    try {
      const res = await fetch(`/api/invitations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        if (status === "ACCEPTED") {
          toast.success("Davet kabul edildi")
          refresh()
        } else {
          toast.success("Davet reddedildi")
        }
        fetchInvitations()
      }
    } catch {
      toast.error("İşlem başarısız")
    }
  }

  if (invitations.length === 0) return null

  return (
    <div className="px-3 py-1">
      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent/70">
        <Mail className="mr-1 inline h-3 w-3" />
        Davetler ({invitations.length})
      </p>
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="mb-1 rounded-lg bg-accent/5 px-2.5 py-2"
        >
          <p className="text-[12px] font-medium truncate flex items-center gap-1.5">
            <PageIcon icon={inv.document.icon} size={14} />
            <span className="truncate">{inv.document.title}</span>
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {inv.inviter.name} tarafından
          </p>
          <div className="mt-1.5 flex gap-1.5">
            <button
              onClick={() => handleRespond(inv.id, "ACCEPTED")}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent/20 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/30"
            >
              <Check className="h-3 w-3" />
              Kabul
            </button>
            <button
              onClick={() => handleRespond(inv.id, "DECLINED")}
              className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-foreground/5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-foreground/10"
            >
              <X className="h-3 w-3" />
              Reddet
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

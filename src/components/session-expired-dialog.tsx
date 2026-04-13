"use client"

import { useRouter } from "next/navigation"
import { LogIn, ShieldAlert } from "lucide-react"
import { useSession } from "@/stores/use-session"

export function SessionExpiredDialog() {
  const router = useRouter()
  const sessionExpired = useSession((s) => s.sessionExpired)

  if (!sessionExpired) return null

  const handleLogin = () => {
    router.push("/login")
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="animate-scale-in relative z-10 w-full max-w-md rounded-2xl border border-border/50 bg-popover p-6 shadow-2xl">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold">
              Oturumunuz sona erdi
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Oturumunuzun süresi dolmuş veya başka bir yerden çıkış yapılmış.
              Kaydetmediğiniz değişiklikler kaybolmuş olabilir.
              Lütfen tekrar giriş yapın.
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4" />
            Giriş Yap
          </button>
        </div>
      </div>
    </div>
  )
}

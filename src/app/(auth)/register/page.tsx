"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Logo } from "@/components/logo"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Kayıt başarısız.")
        return
      }

      router.push("/documents")
      router.refresh()
    } catch {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[400px] animate-slide-up">
      <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size={56} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Kotion&apos;a Katıl
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Ücretsiz hesap oluştur
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="animate-slide-down rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ad Soyad
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız Soyadınız"
              required
              autoComplete="name"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/50 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-md shadow-accent/20 transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              "Kayıt Ol"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Zaten hesabın var mı?{" "}
          <Link
            href="/login"
            className="font-semibold text-accent transition-colors hover:text-accent/80"
          >
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}

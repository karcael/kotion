"use client"

import { useRouter } from "next/navigation"
import { LogOut, Moon, Sun, ChevronDown } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useRef, useEffect } from "react"

interface UserItemProps {
  user: {
    id: string
    name: string
    email: string
  }
}

export function UserItem({ user }: UserItemProps) {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="relative px-3" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-foreground/5"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent/80 text-[11px] font-bold text-accent-foreground shadow-sm">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="truncate text-foreground/80">{user.name}</span>
        <ChevronDown className={`ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${showMenu ? "rotate-180" : ""}`} />
      </button>

      {showMenu && (
        <div className="animate-slide-down absolute left-3 right-3 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border/80 bg-popover p-1 shadow-xl">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            {user.email}
          </div>
          <div className="mx-2 my-1 h-px bg-border/60" />
          <button
            onClick={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
              setShowMenu(false)
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-foreground/5"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {resolvedTheme === "dark" ? "Aydınlık Mod" : "Karanlık Mod"}
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors hover:bg-foreground/5"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      )}
    </div>
  )
}

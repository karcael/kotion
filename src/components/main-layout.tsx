"use client"

import { useEffect, useRef } from "react"
import { Sidebar } from "@/components/sidebar/sidebar"
import { SearchCommand } from "@/components/search-command"
import { SessionExpiredDialog } from "@/components/session-expired-dialog"
import { useSidebar } from "@/stores/use-sidebar"
import { useSession } from "@/stores/use-session"

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

interface MainLayoutProps {
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
  children: React.ReactNode
}

export function MainLayout({ user, children }: MainLayoutProps) {
  const { isOpen, width } = useSidebar()
  const setSessionExpired = useSession((s) => s.setSessionExpired)
  const sessionExpired = useSession((s) => s.sessionExpired)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Periodically check if the session is still valid
  useEffect(() => {
    if (sessionExpired) return

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (res.status === 401) {
          setSessionExpired(true)
        }
      } catch {
        // Network error - skip, will retry next interval
      }
    }

    intervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sessionExpired, setSessionExpired])

  return (
    <div className="flex h-screen">
      <Sidebar user={user} />
      <main
        className="main-content flex-1 overflow-x-hidden overflow-y-auto transition-[margin-left] duration-200"
        style={{ marginLeft: isOpen ? `${width}px` : 0 }}
      >
        <SearchCommand />
        {children}
      </main>
      <SessionExpiredDialog />
    </div>
  )
}

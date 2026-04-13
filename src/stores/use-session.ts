import { create } from "zustand"

interface SessionStore {
  sessionExpired: boolean
  setSessionExpired: (expired: boolean) => void
}

export const useSession = create<SessionStore>()((set) => ({
  sessionExpired: false,
  setSessionExpired: (expired) => set({ sessionExpired: expired }),
}))

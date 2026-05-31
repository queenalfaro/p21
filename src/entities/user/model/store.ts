import { create } from "zustand"
import type { User } from "./types"

interface UserStore {
    user: User | null
    setUser: (user: User) => void
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}))

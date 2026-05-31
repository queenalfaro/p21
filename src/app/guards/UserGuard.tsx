import { useEffect } from "react"
import { Navigate, Outlet } from "react-router"
import { useGetUser, useUserStore } from "@/entities/user"
import { getCurrentUserId } from "@/shared/lib/identity"

export function UserGuard() {
    const setUser = useUserStore((s) => s.setUser)
    const userId = getCurrentUserId()
    const { data: user, isLoading } = useGetUser(userId)

    useEffect(() => {
        if (user) setUser(user)
    }, [user, setUser])

    if (isLoading) {
        return (
            <div className="mx-auto flex min-h-svh max-w-[480px] items-center justify-center bg-background">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
        )
    }

    if (!user) return <Navigate to="/onboarding" replace />

    return (
        <div className="mx-auto min-h-svh max-w-[480px] bg-background">
            <Outlet />
        </div>
    )
}

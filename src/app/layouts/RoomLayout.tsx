import { Outlet, useParams } from "react-router"
import { usePermissions } from "@/entities/room"
import { useUserStore } from "@/entities/user"
import { useBackgroundAnalytics } from "@/processes/background-analytics"

/**
 * Wraps all /room/:id/* routes at the app layer — the only layer
 * allowed to import from processes per FSD.
 * Mounts background analytics for non-admin users transparently.
 */
export function RoomLayout() {
    const { id } = useParams<{ id: string }>()
    const user = useUserStore((s) => s.user)
    const { isAdmin, isLoaded } = usePermissions(id, user?.id)

    // Only track engagement for regular users; adminview must not send analytics
    useBackgroundAnalytics(isLoaded && !isAdmin ? (id ?? null) : null)

    return <Outlet />
}

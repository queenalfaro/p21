import { useGetMembership } from "./use-get-membership"

export function usePermissions(roomId: string | undefined, userId: string | undefined) {
    const { data: membership, isLoading } = useGetMembership(roomId, userId)

    function can(permission: string): boolean {
        if (!membership) return false
        if (membership.role === "admin") return true
        const perms = membership.permissions as string[] | null
        return perms?.includes(permission) ?? false
    }

    return {
        can,
        role: membership?.role ?? null,
        isAdmin: membership?.role === "admin",
        isLoaded: !isLoading,
    }
}

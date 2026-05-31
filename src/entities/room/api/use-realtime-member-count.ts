import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"

/**
 * Subscribes to Realtime postgres_changes on room_members for INSERT and DELETE.
 * Invalidates the member count query so the header and join page update immediately
 * when someone joins or is removed.
 * Requires room_members to be in the supabase_realtime publication (see SQL migration).
 */
export function useRealtimeMemberCount(roomId: string | undefined): void {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!roomId) return

        const channel = supabase
            .channel(`room-members-count-${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "room_members",
                    filter: `room_id=eq.${roomId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["room_members", "count", roomId] })
                    queryClient.invalidateQueries({ queryKey: ["room_members", "list", roomId] })
                },
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: "public",
                    table: "room_members",
                    filter: `room_id=eq.${roomId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: ["room_members", "count", roomId] })
                    queryClient.invalidateQueries({ queryKey: ["room_members", "list", roomId] })
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, queryClient])
}

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Tables } from "@/shared/api"

/**
 * Subscribes to Realtime postgres_changes for a specific room row.
 * Invalidates the room query on any UPDATE so all consumers (room header,
 * room settings, analytics dashboard) see the new status immediately.
 * Requires rooms to be in the supabase_realtime publication (see SQL migration).
 */
export function useRealtimeRoom(roomId: string | undefined): void {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!roomId) return

        const channel = supabase
            .channel(`room-meta-${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "rooms",
                    filter: `id=eq.${roomId}`,
                },
                (event) => {
                    const updated = event.new as Tables<"rooms">
                    // Update cache directly — avoids a roundtrip fetch
                    queryClient.setQueryData(["rooms", roomId], updated)
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, queryClient])
}

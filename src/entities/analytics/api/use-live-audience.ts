import { useEffect, useRef, useState } from "react"
import { supabase } from "@/shared/api"
import type { Tables } from "@/shared/api"

export interface LiveAudienceCounts {
    online: number
    engaged: number
    distracted: number
    unknown: number
}

type StateRow = Tables<"current_user_states">

/**
 * Subscribes to Realtime postgres_changes on current_user_states for the given room.
 * Maintains an in-memory Map<userId, StateRow> and derives live aggregate counts.
 * Requires the table to be LOGGED and added to supabase_realtime publication (see SQL migration).
 */
export function useLiveAudience(roomId: string): LiveAudienceCounts {
    // Map is stable across renders — we only update counts state when the aggregate changes
    const stateMap = useRef(new Map<string, StateRow>())
    const [counts, setCounts] = useState<LiveAudienceCounts>({
        online: 0,
        engaged: 0,
        distracted: 0,
        unknown: 0,
    })

    useEffect(() => {
        // Seed: load current snapshot for this room so the dashboard isn't empty on mount
        supabase
            .from("current_user_states")
            .select("*")
            .eq("room_id", roomId)
            .then(({ data }) => {
                if (!data) return
                const map = stateMap.current
                map.clear()
                for (const row of data) map.set(row.user_id, row)
                setCounts(aggregate(map))
            })

        const channel = supabase
            .channel(`live-audience-${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "*", // INSERT, UPDATE, DELETE
                    schema: "public",
                    table: "current_user_states",
                    filter: `room_id=eq.${roomId}`,
                },
                (event) => {
                    const map = stateMap.current
                    if (event.eventType === "DELETE") {
                        const old = event.old as Partial<StateRow>
                        if (old.user_id) map.delete(old.user_id)
                    } else {
                        const row = event.new as StateRow
                        map.set(row.user_id, row)
                    }
                    setCounts(aggregate(map))
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            stateMap.current.clear()
        }
    }, [roomId])

    return counts
}

// ── aggregation ────────────────────────────────────────────────────────────────

const HARD_TIMEOUT_MS = 5 * 60 * 1000 // 5 min — mirrors server-side take_analytics_snapshot

function aggregate(map: Map<string, StateRow>): LiveAudienceCounts {
    const now = Date.now()
    let online = 0
    let engaged = 0
    let distracted = 0
    let unknown = 0

    for (const row of map.values()) {
        const lastPing = row.last_ping_at ? new Date(row.last_ping_at).getTime() : 0
        const isStale = now - lastPing > HARD_TIMEOUT_MS

        if (row.visible && now - lastPing <= 30_000) online++

        if (isStale || row.status === "unknown") {
            unknown++
        } else if (row.status === "engaged") {
            engaged++
        } else if (row.status === "distracted") {
            distracted++
        } else {
            unknown++
        }
    }

    return { online, engaged, distracted, unknown }
}

import { useEffect, useLayoutEffect, useRef } from "react"
import { supabase } from "@/shared/api"
import { useUserStore } from "@/entities/user"
import {
    signalState,
    toSnapshot,
    classify,
    startVisibilityCollector,
    startFocusCollector,
    startLifecycleCollector,
    startInteractionCollector,
    startHeartbeatCollector,
} from "@/features/audience-tracking"

const FLUSH_INTERVAL_MS = 5_000

/**
 * Mounts signal collectors, evaluates the Decision Engine every 5 s,
 * and writes the result to Supabase via update_my_status RPC.
 * Must only be called for non-admin users (adminview never sends analytics).
 */
export function useBackgroundAnalytics(roomId: string | null): void {
    const user = useUserStore((s) => s.user)
    const userRef = useRef(user)
    // Sync ref after paint — keeps latest user without re-triggering the effect
    useLayoutEffect(() => {
        userRef.current = user
    })

    useEffect(() => {
        if (!roomId) return

        // Reset session on each mount (new room or HMR re-mount in dev)
        signalState.startedAt = Date.now()
        signalState.pageClosed = false
        signalState.lastStatus = null

        const stopCollectors = [
            startVisibilityCollector(),
            startFocusCollector(),
            startLifecycleCollector(),
            startInteractionCollector(),
            startHeartbeatCollector(),
        ]

        const interval = setInterval(async () => {
            const currentUser = userRef.current
            if (!currentUser) return

            const snapshot = toSnapshot()
            const result = classify(snapshot)
            signalState.lastStatus = result.status

            try {
                await supabase.rpc("update_my_status", {
                    p_user_id: currentUser.id,
                    p_room_id: roomId,
                    p_status: result.status.toLowerCase(),
                })
            } catch {
                // Analytics is best-effort: never block the UI
            }
        }, FLUSH_INTERVAL_MS)

        // keepalive fetch on pagehide: more reliable than sendBeacon for auth headers
        function onPagehide() {
            const currentUser = userRef.current
            if (!currentUser) return

            signalState.pageClosed = true
            const result = classify(toSnapshot())

            fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/update_my_status`, {
                method: "POST",
                keepalive: true,
                headers: {
                    "Content-Type": "application/json",
                    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
                    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
                },
                body: JSON.stringify({
                    p_user_id: currentUser.id,
                    p_room_id: roomId,
                    p_status: result.status.toLowerCase(),
                }),
            }).catch(() => {})
        }

        window.addEventListener("pagehide", onPagehide)

        return () => {
            clearInterval(interval)
            window.removeEventListener("pagehide", onPagehide)
            stopCollectors.forEach((stop) => stop())
        }
    }, [roomId])
}

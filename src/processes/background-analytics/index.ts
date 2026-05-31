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

// Calls update_my_status via keepalive fetch (works during pagehide and visibilitychange).
// supabase.rpc() is preferred for normal ticks; fetch+keepalive is used when the JS context
// may be frozen (pagehide) or when we need guaranteed delivery on visibility change.
function sendStatusBeacon(userId: string, roomId: string, status: string, visible: boolean): void {
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/update_my_status`, {
        method: "POST",
        keepalive: true,
        headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY as string}`,
        },
        body: JSON.stringify({
            p_user_id: userId,
            p_room_id: roomId,
            p_status: status,
            p_visible: visible,
        }),
    }).catch(() => {})
}

/**
 * Mounts signal collectors, evaluates the Decision Engine every 5 s,
 * and writes the result to Supabase via update_my_status RPC.
 * Also fires an instant ping on visibilitychange so the online graph
 * reacts within ~1 s (not waiting for the next 5 s interval).
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
        // Capture narrowed roomId for closures — TypeScript can't narrow through them
        const activeRoomId: string = roomId

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

        // Periodic flush — normal path
        const interval = setInterval(async () => {
            const currentUser = userRef.current
            if (!currentUser) return

            const snapshot = toSnapshot()
            const result = classify(snapshot)
            signalState.lastStatus = result.status

            try {
                await supabase.rpc("update_my_status", {
                    p_user_id: currentUser.id,
                    p_room_id: activeRoomId,
                    p_status: result.status.toLowerCase(),
                    p_visible: snapshot.visible,
                })
            } catch {
                // Analytics is best-effort: never block the UI
            }
        }, FLUSH_INTERVAL_MS)

        // Instant ping on visibilitychange — makes online graph react in <1 s
        // when the user locks their screen or switches to another app.
        // Uses keepalive fetch because visibilitychange fires right before freeze.
        function onVisibilityChange() {
            const currentUser = userRef.current
            if (!currentUser) return

            const snapshot = toSnapshot()
            const result = classify(snapshot)
            signalState.lastStatus = result.status

            sendStatusBeacon(
                currentUser.id,
                activeRoomId,
                result.status.toLowerCase(),
                snapshot.visible,   // false if screen just went off / app switched
            )
        }

        document.addEventListener("visibilitychange", onVisibilityChange)

        // keepalive fetch on pagehide: marks user as unknown + offline
        function onPagehide() {
            const currentUser = userRef.current
            if (!currentUser) return

            signalState.pageClosed = true
            const result = classify(toSnapshot())

            sendStatusBeacon(currentUser.id, activeRoomId, result.status.toLowerCase(), false)
        }

        window.addEventListener("pagehide", onPagehide)

        return () => {
            clearInterval(interval)
            document.removeEventListener("visibilitychange", onVisibilityChange)
            window.removeEventListener("pagehide", onPagehide)
            stopCollectors.forEach((stop) => stop())
        }
    }, [roomId])
}

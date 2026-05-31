import { useState, useEffect } from "react"

export type PushPermissionState = "default" | "granted" | "denied" | "unsupported"

/**
 * Stub: returns current Notification permission state.
 * Full FCM subscription is deferred to a later phase.
 */
export function usePushPermission(): PushPermissionState {
    const [state, setState] = useState<PushPermissionState>(() => {
        if (typeof Notification === "undefined") return "unsupported"
        return Notification.permission as PushPermissionState
    })

    useEffect(() => {
        if (typeof Notification === "undefined") return

        // Poll for permission changes (Permissions API is not widely supported for notifications)
        const id = setInterval(() => {
            setState(Notification.permission as PushPermissionState)
        }, 2_000)
        return () => clearInterval(id)
    }, [])

    return state
}

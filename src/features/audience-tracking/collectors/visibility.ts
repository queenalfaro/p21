import { signalState } from "../lib/signal-state"

export function startVisibilityCollector(): () => void {
    function handler() {
        if (document.visibilityState === "visible") {
            signalState.visible = true
            signalState.hiddenAt = null
        } else {
            signalState.visible = false
            signalState.hiddenAt = Date.now()
            // Capture interaction-to-hide gap at the exact moment of hide
            signalState.msFromInteractionToHide = Date.now() - signalState.lastInteractionAt
        }
    }
    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
}

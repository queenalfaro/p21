import { signalState } from "../lib/signal-state"

export function startInteractionCollector(): () => void {
    function handler() {
        signalState.lastInteractionAt = Date.now()
    }
    window.addEventListener("touchstart", handler, { passive: true })
    window.addEventListener("click", handler)
    window.addEventListener("keydown", handler)
    return () => {
        window.removeEventListener("touchstart", handler)
        window.removeEventListener("click", handler)
        window.removeEventListener("keydown", handler)
    }
}

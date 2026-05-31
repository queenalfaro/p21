import { signalState } from "../lib/signal-state"

export function startLifecycleCollector(): () => void {
    function onPagehide() {
        signalState.pageClosed = true
    }
    window.addEventListener("pagehide", onPagehide)
    return () => window.removeEventListener("pagehide", onPagehide)
}

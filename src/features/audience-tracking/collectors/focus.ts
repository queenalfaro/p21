import { signalState } from "../lib/signal-state"

export function startFocusCollector(): () => void {
    function onFocus() {
        signalState.focused = true
        signalState.focusLostAt = null
    }
    function onBlur() {
        signalState.focused = false
        signalState.focusLostAt = Date.now()
    }
    window.addEventListener("focus", onFocus)
    window.addEventListener("blur", onBlur)
    return () => {
        window.removeEventListener("focus", onFocus)
        window.removeEventListener("blur", onBlur)
    }
}

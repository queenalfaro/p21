import type { SignalSnapshot, EngagementStatus } from "../model/types"

// Mutable singleton — intentionally not Zustand so it never triggers re-renders
export const signalState = {
    visible: typeof document !== "undefined" ? document.visibilityState === "visible" : true,
    focused: typeof document !== "undefined" ? document.hasFocus() : true,
    lastInteractionAt: Date.now(),
    hiddenAt: (typeof document !== "undefined" && document.visibilityState === "hidden") ? Date.now() : null as number | null,
    // Fixed at the moment of visible→hidden; stays until page becomes visible again
    msFromInteractionToHide: Number.MAX_SAFE_INTEGER,
    lastWorkerTickAt: Date.now(),
    focusLostAt: (typeof document !== "undefined" && !document.hasFocus()) ? Date.now() : null as number | null,
    pageClosed: false,
    startedAt: Date.now(),
    lastStatus: null as EngagementStatus | null,
}

export function toSnapshot(): SignalSnapshot {
    const now = Date.now()
    return {
        visible: signalState.visible,
        focused: signalState.focused,
        msSinceLastInteraction: now - signalState.lastInteractionAt,
        msSinceHide: signalState.hiddenAt !== null ? now - signalState.hiddenAt : 0,
        msFromInteractionToHide: signalState.msFromInteractionToHide,
        msSinceWorkerTick: now - signalState.lastWorkerTickAt,
        msSinceFocusLoss: signalState.focusLostAt !== null ? now - signalState.focusLostAt : 0,
        pageClosed: signalState.pageClosed,
        msSinceStart: now - signalState.startedAt,
        lastStatus: signalState.lastStatus,
    }
}

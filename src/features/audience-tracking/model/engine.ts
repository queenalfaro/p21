import type { SignalSnapshot, EngineResult, EngagementStatus } from "./types"

// Thresholds from userless.md — do not adjust without spec change
const WARMUP_MS = 3_000
const ACTIVE_INTERACTION_MS = 5_000
const TRANSIENT_FOCUS_LOSS_MS = 30_000
const BRIEF_HIDDEN_MS = 5_000
const LONG_HIDDEN_MS = 30_000
const ACTIVE_GESTURE_MS = 3_000
const AWAKE_HEARTBEAT_MS = 15_000
const DEAD_HEARTBEAT_MS = 30_000
const IDLE_TO_HIDE_MS = 10_000

function keepLast(reason: string, lastStatus: EngagementStatus | null): EngineResult {
    return { status: lastStatus ?? "ENGAGED", reason }
}

/**
 * Pure Decision Engine: rules applied in strict priority order (first match wins).
 * Tiers: 0 = terminal, 1 = visible, 2 = hidden.
 */
export function classify(s: SignalSnapshot): EngineResult {
    // Tier 0 — terminal / initial
    if (s.pageClosed) return { status: "UNKNOWN", reason: "page_closed" }
    if (s.msSinceStart < WARMUP_MS) return { status: "UNKNOWN", reason: "warmup" }

    if (s.visible) {
        // Tier 1 — our app is on screen (direct observation, highest confidence)
        if (s.msSinceLastInteraction < ACTIVE_INTERACTION_MS)
            return { status: "ENGAGED", reason: "active_in_app", confidence: 0.95 }
        if (s.focused)
            return { status: "ENGAGED", reason: "app_focused", confidence: 0.90 }
        // visible but not focused — notification shade or OS overlay
        if (s.msSinceFocusLoss < TRANSIENT_FOCUS_LOSS_MS)
            return keepLast("transient_focus_loss", s.lastStatus)
        return { status: "DISTRACTED", reason: "sustained_focus_loss", confidence: 0.75 }
    }

    // Tier 2 — app is hidden (indirect inference)
    if (s.msSinceHide < BRIEF_HIDDEN_MS)
        return keepLast("brief_hidden", s.lastStatus)

    // 2.2: long hidden + active gesture before hide + device still awake → other app
    if (
        s.msSinceHide >= LONG_HIDDEN_MS &&
        s.msFromInteractionToHide < ACTIVE_GESTURE_MS &&
        s.msSinceWorkerTick < AWAKE_HEARTBEAT_MS
    ) return { status: "DISTRACTED", reason: "active_app_switch", confidence: 0.90 }

    // 2.3: long hidden + heartbeat dead → browser frozen = screen off
    if (s.msSinceHide >= LONG_HIDDEN_MS && s.msSinceWorkerTick >= DEAD_HEARTBEAT_MS)
        return { status: "ENGAGED", reason: "screen_off_confirmed", confidence: 0.85 }

    // 2.4: user was idle before hide → screen timeout, not intentional switch
    if (s.msFromInteractionToHide >= IDLE_TO_HIDE_MS)
        return { status: "ENGAGED", reason: "screen_off_idle", confidence: 0.80 }

    return keepLast("hidden_keep_last", s.lastStatus)
}

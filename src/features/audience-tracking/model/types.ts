export type EngagementStatus = "ENGAGED" | "DISTRACTED" | "UNKNOWN"

export interface EngineResult {
    status: EngagementStatus
    reason: string
    confidence?: number
}

export interface SignalSnapshot {
    visible: boolean
    focused: boolean
    msSinceLastInteraction: number
    msSinceHide: number
    msFromInteractionToHide: number
    msSinceWorkerTick: number
    msSinceFocusLoss: number
    pageClosed: boolean
    msSinceStart: number
    lastStatus: EngagementStatus | null
}

import { describe, it, expect } from "vitest"
import { classify } from "./engine"
import type { SignalSnapshot } from "./types"

// Baseline: visible, focused, past warmup, recent interaction
const base: SignalSnapshot = {
    visible: true,
    focused: true,
    msSinceLastInteraction: 1_000,
    msSinceHide: 0,
    msFromInteractionToHide: Number.MAX_SAFE_INTEGER,
    msSinceWorkerTick: 1_000,
    msSinceFocusLoss: 0,
    pageClosed: false,
    msSinceStart: 10_000,
    lastStatus: null,
}

describe("Tier 0 — terminal / initial", () => {
    it("page_closed → UNKNOWN with reason page_closed", () => {
        const r = classify({ ...base, pageClosed: true })
        expect(r.status).toBe("UNKNOWN")
        expect(r.reason).toBe("page_closed")
    })

    it("msSinceStart < 3 s → UNKNOWN with reason warmup", () => {
        const r = classify({ ...base, msSinceStart: 2_000 })
        expect(r.status).toBe("UNKNOWN")
        expect(r.reason).toBe("warmup")
    })

    it("exactly at warmup boundary (3000 ms) → not warmup", () => {
        const r = classify({ ...base, msSinceStart: 3_000 })
        expect(r.reason).not.toBe("warmup")
    })
})

describe("Tier 1 — visible", () => {
    it("rule 1.1: recent interaction (<5 s) → ENGAGED active_in_app (0.95)", () => {
        const r = classify({ ...base, msSinceLastInteraction: 3_000 })
        expect(r.status).toBe("ENGAGED")
        expect(r.reason).toBe("active_in_app")
        expect(r.confidence).toBe(0.95)
    })

    it("rule 1.2: focused, no recent interaction → ENGAGED app_focused (0.90)", () => {
        const r = classify({ ...base, msSinceLastInteraction: 10_000, focused: true })
        expect(r.status).toBe("ENGAGED")
        expect(r.reason).toBe("app_focused")
        expect(r.confidence).toBe(0.90)
    })

    it("rule 1.3: not focused, focus lost <30 s → keep_last (prior ENGAGED)", () => {
        const r = classify({ ...base, focused: false, msSinceLastInteraction: 10_000, msSinceFocusLoss: 15_000, lastStatus: "ENGAGED" })
        expect(r.status).toBe("ENGAGED")
        expect(r.reason).toBe("transient_focus_loss")
    })

    it("rule 1.3: keep_last with no prior → default ENGAGED", () => {
        const r = classify({ ...base, focused: false, msSinceLastInteraction: 10_000, msSinceFocusLoss: 15_000, lastStatus: null })
        expect(r.status).toBe("ENGAGED")
        expect(r.reason).toBe("transient_focus_loss")
    })

    it("rule 1.3: keep_last with prior DISTRACTED → DISTRACTED", () => {
        const r = classify({ ...base, focused: false, msSinceLastInteraction: 10_000, msSinceFocusLoss: 15_000, lastStatus: "DISTRACTED" })
        expect(r.status).toBe("DISTRACTED")
        expect(r.reason).toBe("transient_focus_loss")
    })

    it("rule 1.4: not focused, focus lost ≥30 s → DISTRACTED sustained_focus_loss (0.75)", () => {
        const r = classify({ ...base, focused: false, msSinceLastInteraction: 40_000, msSinceFocusLoss: 35_000 })
        expect(r.status).toBe("DISTRACTED")
        expect(r.reason).toBe("sustained_focus_loss")
        expect(r.confidence).toBe(0.75)
    })
})

describe("Tier 2 — hidden", () => {
    const hidden: SignalSnapshot = {
        ...base,
        visible: false,
        focused: false,
        msSinceLastInteraction: 10_000,
    }

    it("rule 2.1: hidden <5 s → keep_last brief_hidden", () => {
        const r = classify({ ...hidden, msSinceHide: 3_000, lastStatus: "DISTRACTED" })
        expect(r.status).toBe("DISTRACTED")
        expect(r.reason).toBe("brief_hidden")
    })

    it("rule 2.1: brief hidden with null prior → ENGAGED (default)", () => {
        const r = classify({ ...hidden, msSinceHide: 3_000, lastStatus: null })
        expect(r.status).toBe("ENGAGED")
        expect(r.reason).toBe("brief_hidden")
    })

    it("rule 2.2: ≥30 s hidden + active gesture + device awake → DISTRACTED active_app_switch (0.90)", () => {
        const r = classify({ ...hidden, msSinceHide: 35_000, msFromInteractionToHide: 1_500, msSinceWorkerTick: 5_000 })
        expect(r.status).toBe("DISTRACTED")
        expect(r.reason).toBe("active_app_switch")
        expect(r.confidence).toBe(0.90)
    })

    it("rule 2.2 does NOT fire when worker is dead (device asleep)", () => {
        const r = classify({ ...hidden, msSinceHide: 35_000, msFromInteractionToHide: 1_500, msSinceWorkerTick: 35_000 })
        expect(r.reason).not.toBe("active_app_switch")
    })

    it("rule 2.3: ≥30 s hidden + dead heartbeat → ENGAGED screen_off_confirmed (0.85)", () => {
        const r = classify({ ...hidden, msSinceHide: 35_000, msFromInteractionToHide: 1_500, msSinceWorkerTick: 35_000 })
        expect(r.status).toBe("ENGAGED")
        expect(r.reason).toBe("screen_off_confirmed")
        expect(r.confidence).toBe(0.85)
    })

    it("rule 2.4: idle ≥10 s before hide → ENGAGED screen_off_idle (0.80)", () => {
        const r = classify({ ...hidden, msSinceHide: 10_000, msFromInteractionToHide: 15_000, msSinceWorkerTick: 2_000 })
        expect(r.status).toBe("ENGAGED")
        expect(r.reason).toBe("screen_off_idle")
        expect(r.confidence).toBe(0.80)
    })

    it("rule 2.5 fallback: ambiguous state → keep_last hidden_keep_last", () => {
        // hidden 10 s, gesture 5 s before hide (not active, not idle), worker alive
        const r = classify({ ...hidden, msSinceHide: 10_000, msFromInteractionToHide: 5_000, msSinceWorkerTick: 2_000, lastStatus: "ENGAGED" })
        expect(r.status).toBe("ENGAGED")
        expect(r.reason).toBe("hidden_keep_last")
    })
})

describe("Rule priority: Tier 0 beats everything", () => {
    it("page_closed overrides even visible + focused + interaction", () => {
        const r = classify({ ...base, pageClosed: true, visible: true, focused: true, msSinceLastInteraction: 100 })
        expect(r.status).toBe("UNKNOWN")
        expect(r.reason).toBe("page_closed")
    })

    it("warmup overrides visible + focused", () => {
        const r = classify({ ...base, msSinceStart: 500, visible: true, focused: true })
        expect(r.status).toBe("UNKNOWN")
        expect(r.reason).toBe("warmup")
    })
})

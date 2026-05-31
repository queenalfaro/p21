import type { Roadmap } from "../model/types"

export interface SegmentInterval {
    id: string
    title: string
    startMs: number
    endMs: number | null // null = segment is currently active (open-ended)
}

/**
 * Derives chart intervals for ReferenceArea from activated segments.
 * Only 'active' and 'done' segments appear on the chart.
 * Each interval spans from its activatedAt to the next segment's activatedAt (or null if still active).
 */
export function getSegmentIntervals(roadmap: Roadmap, nowMs: number = Date.now()): SegmentInterval[] {
    const activated = roadmap
        .filter((s) => s.status !== "upcoming" && s.activatedAt)
        .sort((a, b) => new Date(a.activatedAt!).getTime() - new Date(b.activatedAt!).getTime())

    return activated.map((seg, i) => {
        const startMs = new Date(seg.activatedAt!).getTime()
        const next = activated[i + 1]
        const endMs = next
            ? new Date(next.activatedAt!).getTime()
            : seg.status === "active"
              ? nowMs  // still running — use current time as a live right edge
              : null   // done but no next segment found — still treat as closed
        return { id: seg.id, title: seg.title, startMs, endMs }
    })
}

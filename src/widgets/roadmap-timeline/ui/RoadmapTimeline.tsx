import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    CheckmarkCircle01Icon,
    Time01Icon,
    RadioIcon,
    ArrowDown01Icon,
    ArrowUp01Icon,
} from "@hugeicons/core-free-icons"
import { useRoadmap } from "@/entities/roadmap"
import type { RoadmapSegment } from "@/entities/roadmap"
import { cn } from "@/shared/lib/cn"

// ── single segment row ─────────────────────────────────────────────────────────

interface SegmentItemProps {
    seg: RoadmapSegment
}

function SegmentItem({ seg }: SegmentItemProps) {
    const [open, setOpen] = useState(seg.status === "active")

    const icon =
        seg.status === "done" ? (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-primary/70 shrink-0 mt-0.5" />
        ) : seg.status === "active" ? (
            <HugeiconsIcon icon={RadioIcon} size={18} className="text-green-500 shrink-0 mt-0.5 animate-pulse" />
        ) : (
            <HugeiconsIcon icon={Time01Icon} size={18} className="text-muted-foreground/50 shrink-0 mt-0.5" />
        )

    const hasNotes = !!seg.notes?.trim()

    return (
        <div
            className={cn(
                "rounded-xl border px-3.5 py-3 transition-colors",
                seg.status === "active" && "border-green-500/40 bg-green-500/5",
                seg.status === "done" && "opacity-75",
                seg.status === "upcoming" && "border-border",
            )}
        >
            <button
                className="flex w-full items-start gap-2.5 text-left"
                onClick={() => hasNotes && setOpen((v) => !v)}
                disabled={!hasNotes}
            >
                {icon}

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p
                            className={cn(
                                "text-sm font-medium leading-snug",
                                seg.status === "upcoming" && "text-muted-foreground",
                            )}
                        >
                            {seg.title}
                        </p>
                        {seg.status === "active" && (
                            <span className="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-600">
                                Now
                            </span>
                        )}
                        {seg.status === "upcoming" && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                Soon
                            </span>
                        )}
                    </div>
                    {seg.activatedAt && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {new Date(seg.activatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    )}
                </div>

                {hasNotes && (
                    <HugeiconsIcon
                        icon={open ? ArrowUp01Icon : ArrowDown01Icon}
                        size={14}
                        className="mt-1 shrink-0 text-muted-foreground"
                    />
                )}
            </button>

            {open && hasNotes && (
                <p className="mt-2 pl-7 text-xs leading-relaxed text-muted-foreground">
                    {seg.notes}
                </p>
            )}
        </div>
    )
}

// ── main component ─────────────────────────────────────────────────────────────

interface RoadmapTimelineProps {
    roomId: string
}

export function RoadmapTimeline({ roomId }: RoadmapTimelineProps) {
    const { roadmap, isLoading } = useRoadmap(roomId)
    const sorted = [...roadmap].sort((a, b) => a.order - b.order)

    if (isLoading) {
        return (
            <div className="flex justify-center py-6">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    if (sorted.length === 0) return null

    return (
        <section className="space-y-1.5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Agenda
            </p>
            {sorted.map((seg) => (
                <SegmentItem key={seg.id} seg={seg} />
            ))}
        </section>
    )
}

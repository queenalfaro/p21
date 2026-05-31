import { useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    Add01Icon,
    Delete02Icon,
    CheckmarkCircle01Icon,
    PlayIcon,
    ArrowUp01Icon,
    ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import { useGetRoom, useUpdateRoom } from "@/entities/room"
import { useRoadmap } from "@/entities/roadmap"
import type { RoadmapSegment } from "@/entities/roadmap"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/lib/cn"

// ── helpers ────────────────────────────────────────────────────────────────────

function makeId(): string {
    return Math.random().toString(36).slice(2, 10)
}

const STATUS_STYLES: Record<RoadmapSegment["status"], string> = {
    upcoming:  "bg-muted text-muted-foreground",
    active:    "bg-green-500/15 text-green-600",
    done:      "bg-primary/10 text-primary",
}

const STATUS_LABELS: Record<RoadmapSegment["status"], string> = {
    upcoming: "Soon",
    active:   "Live",
    done:     "Done",
}

// ── new segment form ───────────────────────────────────────────────────────────

interface AddSegmentFormProps {
    onAdd: (seg: RoadmapSegment) => void
    nextOrder: number
}

function AddSegmentForm({ onAdd, nextOrder }: AddSegmentFormProps) {
    const [title, setTitle] = useState("")
    const [notes, setNotes] = useState("")

    function submit() {
        const t = title.trim()
        if (!t) return
        onAdd({
            id: makeId(),
            title: t,
            notes: notes.trim(),
            order: nextOrder,
            status: "upcoming",
        })
        setTitle("")
        setNotes("")
    }

    return (
        <div className="space-y-2 rounded-lg border border-dashed p-3">
            <p className="text-xs font-medium text-muted-foreground">New stage</p>
            <div className="space-y-1.5">
                <Input
                    placeholder="Stage title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    className="text-sm"
                />
                <Textarea
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none text-sm"
                    rows={2}
                />
            </div>
            <Button size="sm" onClick={submit} disabled={!title.trim()} className="w-full gap-1.5">
                <HugeiconsIcon icon={Add01Icon} size={14} />
                Add stage
            </Button>
        </div>
    )
}

// ── segment row ────────────────────────────────────────────────────────────────

interface SegmentRowProps {
    seg: RoadmapSegment
    isFirst: boolean
    isLast: boolean
    onActivate: () => void
    onDelete: () => void
    onMoveUp: () => void
    onMoveDown: () => void
}

function SegmentRow({ seg, isFirst, isLast, onActivate, onDelete, onMoveUp, onMoveDown }: SegmentRowProps) {
    const [expanded, setExpanded] = useState(false)
    const canActivate = seg.status === "upcoming"

    return (
        <div className={cn("rounded-lg border", seg.status === "active" && "border-green-500/50")}>
            <div className="flex items-center gap-2 px-3 py-2">
                {/* order controls */}
                <div className="flex flex-col gap-0.5">
                    <button
                        onClick={onMoveUp}
                        disabled={isFirst}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                        aria-label="Move up"
                    >
                        <HugeiconsIcon icon={ArrowUp01Icon} size={12} />
                    </button>
                    <button
                        onClick={onMoveDown}
                        disabled={isLast}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                        aria-label="Move down"
                    >
                        <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
                    </button>
                </div>

                {/* title + status */}
                <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setExpanded((v) => !v)}
                >
                    <p className="truncate text-sm font-medium">{seg.title}</p>
                    {seg.activatedAt && (
                        <p className="text-[10px] text-muted-foreground">
                            {new Date(seg.activatedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </p>
                    )}
                </button>

                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_STYLES[seg.status])}>
                    {STATUS_LABELS[seg.status]}
                </span>

                {/* activate button */}
                {canActivate && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-green-600 hover:bg-green-500/10"
                        onClick={onActivate}
                        title="Activate this stage"
                        aria-label={`Activate stage: ${seg.title}`}
                    >
                        <HugeiconsIcon icon={PlayIcon} size={14} />
                    </Button>
                )}
                {seg.status === "active" && (
                    <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={16}
                        className="shrink-0 text-green-600"
                    />
                )}

                {/* delete */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                    aria-label={`Delete stage: ${seg.title}`}
                >
                    <HugeiconsIcon icon={Delete02Icon} size={14} />
                </Button>
            </div>

            {/* expanded notes */}
            {expanded && seg.notes && (
                <p className="border-t px-3 py-2 text-xs text-muted-foreground">{seg.notes}</p>
            )}
        </div>
    )
}

// ── main component ─────────────────────────────────────────────────────────────

interface RoadmapEditorProps {
    roomId: string
}

export function RoadmapEditor({ roomId }: RoadmapEditorProps) {
    const { data: room } = useGetRoom(roomId)
    const { roadmap } = useRoadmap(roomId)
    const { mutateAsync: updateRoom, isPending } = useUpdateRoom(roomId)

    // Persist the updated roadmap array back into rooms.settings.roadmap
    async function saveRoadmap(next: RoadmapSegment[]) {
        if (!room) return
        const currentSettings =
            room.settings && typeof room.settings === "object" && !Array.isArray(room.settings)
                ? (room.settings as Record<string, unknown>)
                : {}
        try {
            await updateRoom({ settings: { ...currentSettings, roadmap: next } })
        } catch {
            toast.error("Failed to save roadmap")
        }
    }

    function handleAdd(seg: RoadmapSegment) {
        const reordered = [...roadmap, seg].map((s, i) => ({ ...s, order: i }))
        saveRoadmap(reordered)
    }

    function handleActivate(id: string) {
        const now = new Date().toISOString()
        const next = roadmap.map((s) => {
            if (s.id === id) return { ...s, status: "active" as const, activatedAt: now }
            if (s.status === "active") return { ...s, status: "done" as const }
            return s
        })
        saveRoadmap(next)
    }

    function handleDelete(id: string) {
        const next = roadmap.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i }))
        saveRoadmap(next)
    }

    function handleMove(id: string, direction: "up" | "down") {
        const sorted = [...roadmap].sort((a, b) => a.order - b.order)
        const idx = sorted.findIndex((s) => s.id === id)
        if (idx < 0) return
        const target = direction === "up" ? idx - 1 : idx + 1
        if (target < 0 || target >= sorted.length) return
        ;[sorted[idx], sorted[target]] = [sorted[target], sorted[idx]]
        const next = sorted.map((s, i) => ({ ...s, order: i }))
        saveRoadmap(next)
    }

    const sorted = [...roadmap].sort((a, b) => a.order - b.order)

    return (
        <div className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Agenda
                </Label>
                {isPending && (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                )}
            </div>

            {sorted.length === 0 && (
                <p className="text-xs text-muted-foreground/60 py-1">
                    No stages yet. Add stages below.
                </p>
            )}

            <div className="space-y-1.5">
                {sorted.map((seg, i) => (
                    <SegmentRow
                        key={seg.id}
                        seg={seg}
                        isFirst={i === 0}
                        isLast={i === sorted.length - 1}
                        onActivate={() => handleActivate(seg.id)}
                        onDelete={() => handleDelete(seg.id)}
                        onMoveUp={() => handleMove(seg.id, "up")}
                        onMoveDown={() => handleMove(seg.id, "down")}
                    />
                ))}
            </div>

            <AddSegmentForm onAdd={handleAdd} nextOrder={sorted.length} />
        </div>
    )
}

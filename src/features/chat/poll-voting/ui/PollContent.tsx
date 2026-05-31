import { cn } from "@/shared/lib/cn"
import { useInteractions, useInteract } from "@/entities/message"
import { getCurrentUserId } from "@/shared/lib/identity"
import type { PollPayload } from "@/entities/message"

interface PollContentProps {
    messageId: string
    payload: PollPayload
    isOwn: boolean
}

export function PollContent({ messageId, payload, isOwn }: PollContentProps) {
    const userId = getCurrentUserId()
    const { data: interactions = [] } = useInteractions(messageId)
    const { mutate: interact, isPending } = useInteract()

    const myVote = interactions.find(
        (i) => i.user_id === userId && i.interaction_type === "vote",
    )
    const myChoice = myVote ? (myVote.value as { option: number } | null)?.option ?? null : null
    const hasVoted = myChoice !== null

    const counts = payload.options.map(
        (_, idx) =>
            interactions.filter(
                (i) =>
                    i.interaction_type === "vote" &&
                    (i.value as { option?: number } | null)?.option === idx,
            ).length,
    )
    const total = counts.reduce((a, b) => a + b, 0)

    function vote(idx: number) {
        if (isPending) return
        interact({ messageId, interactionType: "vote", value: { option: idx } })
    }

    return (
        <div className="min-w-[180px] space-y-1.5 py-0.5">
            <p className="text-sm font-medium leading-snug">{payload.question}</p>
            <div className="space-y-1">
                {payload.options.map((opt, idx) => {
                    const count = counts[idx]
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    const selected = myChoice === idx
                    return (
                        <button
                            key={idx}
                            onClick={() => vote(idx)}
                            disabled={isPending}
                            className={cn(
                                "relative w-full overflow-hidden rounded-lg px-3 py-2 text-left text-xs transition-opacity disabled:opacity-60",
                                isOwn
                                    ? "bg-white/15 hover:bg-white/25"
                                    : "bg-black/8 hover:bg-black/12",
                                selected && (isOwn ? "bg-white/30" : "bg-primary/15"),
                            )}
                        >
                            {/* progress bar */}
                            {hasVoted && (
                                <span
                                    className={cn(
                                        "absolute inset-0 origin-left transition-transform duration-300",
                                        isOwn ? "bg-white/10" : "bg-primary/10",
                                    )}
                                    style={{ transform: `scaleX(${pct / 100})` }}
                                />
                            )}
                            <span className="relative flex items-center justify-between gap-2">
                                <span className={cn("flex-1", selected && "font-semibold")}>
                                    {opt}
                                </span>
                                {hasVoted && (
                                    <span className="shrink-0 tabular-nums opacity-70">
                                        {pct}%
                                    </span>
                                )}
                            </span>
                        </button>
                    )
                })}
            </div>
            {total > 0 && (
                <p className={cn("text-[10px]", isOwn ? "opacity-60" : "text-muted-foreground")}>
                    {total} {total === 1 ? "vote" : "votes"}
                </p>
            )}
        </div>
    )
}

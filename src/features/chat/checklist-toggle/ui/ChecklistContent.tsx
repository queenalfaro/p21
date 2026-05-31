import { cn } from "@/shared/lib/cn"
import { useInteractions, useInteract } from "@/entities/message"
import { getCurrentUserId } from "@/shared/lib/identity"
import type { ChecklistPayload } from "@/entities/message"

interface ChecklistContentProps {
    messageId: string
    payload: ChecklistPayload
    isOwn: boolean
}

// Value stored as { checked: number[] } — list of checked item indices per user.
// Each user has one "check" interaction row; value encodes their entire state.

export function ChecklistContent({ messageId, payload, isOwn }: ChecklistContentProps) {
    const userId = getCurrentUserId()
    const { data: interactions = [] } = useInteractions(messageId)
    const { mutate: interact, isPending } = useInteract()

    const myRow = interactions.find(
        (i) => i.user_id === userId && i.interaction_type === "check",
    )
    const myChecked: number[] = (myRow?.value as { checked?: number[] } | null)?.checked ?? []

    function toggle(idx: number) {
        if (isPending) return
        const next = myChecked.includes(idx)
            ? myChecked.filter((i) => i !== idx)
            : [...myChecked, idx]
        interact({ messageId, interactionType: "check", value: { checked: next } })
    }

    // Total unique checkers per item
    const itemCheckers = payload.items.map(
        (_, idx) =>
            interactions.filter(
                (i) =>
                    i.interaction_type === "check" &&
                    ((i.value as { checked?: number[] } | null)?.checked ?? []).includes(idx),
            ).length,
    )
    const totalUsers = new Set(
        interactions.filter((i) => i.interaction_type === "check").map((i) => i.user_id),
    ).size

    return (
        <div className="min-w-[180px] space-y-1.5 py-0.5">
            <p className="text-sm font-medium leading-snug">{payload.title}</p>
            <div className="space-y-1">
                {payload.items.map((item, idx) => {
                    const checked = myChecked.includes(idx)
                    const checkers = itemCheckers[idx]
                    return (
                        <button
                            key={idx}
                            onClick={() => toggle(idx)}
                            disabled={isPending}
                            className={cn(
                                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-opacity disabled:opacity-60",
                                isOwn ? "hover:bg-white/15" : "hover:bg-black/8",
                            )}
                        >
                            {/* Custom checkbox */}
                            <span
                                className={cn(
                                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                    checked
                                        ? isOwn
                                            ? "border-white bg-white"
                                            : "border-primary bg-primary"
                                        : isOwn
                                          ? "border-white/50"
                                          : "border-muted-foreground/50",
                                )}
                            >
                                {checked && (
                                    <svg
                                        width="10"
                                        height="8"
                                        viewBox="0 0 10 8"
                                        fill="none"
                                        className={isOwn ? "text-primary" : "text-primary-foreground"}
                                    >
                                        <path
                                            d="M1 4L3.5 6.5L9 1"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </span>
                            <span className={cn("flex-1 leading-tight", checked && "line-through opacity-60")}>
                                {item}
                            </span>
                            {checkers > 0 && (
                                <span className={cn("shrink-0 text-[10px] opacity-50")}>
                                    {checkers}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
            {totalUsers > 0 && (
                <p className={cn("text-[10px]", isOwn ? "opacity-60" : "text-muted-foreground")}>
                    {totalUsers} {totalUsers === 1 ? "person" : "people"} responded
                </p>
            )}
        </div>
    )
}

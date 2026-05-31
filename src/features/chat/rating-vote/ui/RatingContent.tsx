import { cn } from "@/shared/lib/cn"
import { useInteractions, useInteract } from "@/entities/message"
import { getCurrentUserId } from "@/shared/lib/identity"
import type { RatingPayload } from "@/entities/message"

const STARS = [1, 2, 3, 4, 5]

interface RatingContentProps {
    messageId: string
    payload: RatingPayload
    isOwn: boolean
}

export function RatingContent({ messageId, payload, isOwn }: RatingContentProps) {
    const userId = getCurrentUserId()
    const { data: interactions = [] } = useInteractions(messageId)
    const { mutate: interact, isPending } = useInteract()

    const myRow = interactions.find(
        (i) => i.user_id === userId && i.interaction_type === "rate",
    )
    const myStars: number | null = (myRow?.value as { stars?: number } | null)?.stars ?? null

    const rateRows = interactions.filter((i) => i.interaction_type === "rate")
    const avg =
        rateRows.length > 0
            ? rateRows.reduce(
                  (sum, i) => sum + ((i.value as { stars?: number } | null)?.stars ?? 0),
                  0,
              ) / rateRows.length
            : null

    function rate(stars: number) {
        if (isPending) return
        interact({ messageId, interactionType: "rate", value: { stars } })
    }

    return (
        <div className="min-w-[180px] space-y-2 py-0.5">
            <p className="text-sm font-medium leading-snug">{payload.question}</p>
            <div className="flex gap-1">
                {STARS.map((star) => (
                    <button
                        key={star}
                        onClick={() => rate(star)}
                        disabled={isPending}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        className={cn(
                            "text-xl leading-none transition-transform active:scale-90 disabled:opacity-60",
                            myStars !== null && star <= myStars ? "opacity-100" : "opacity-30",
                        )}
                    >
                        ⭐
                    </button>
                ))}
            </div>
            <div className={cn("text-[10px]", isOwn ? "opacity-60" : "text-muted-foreground")}>
                {avg !== null ? (
                    <>
                        <span className="font-semibold">{avg.toFixed(1)}</span>
                        {" avg · "}
                        {rateRows.length} {rateRows.length === 1 ? "rating" : "ratings"}
                    </>
                ) : (
                    "No ratings yet"
                )}
            </div>
        </div>
    )
}

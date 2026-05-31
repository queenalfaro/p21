import { cn } from "@/shared/lib/cn"
import type { ParentMessage, TextPayload } from "../model/types"

function quotePreview(parent: ParentMessage): string {
    if (!parent.type || !parent.payload) return "…"
    const p = parent.payload as Record<string, unknown>
    switch (parent.type) {
        case "text":
            return (p as TextPayload).text?.slice(0, 80) ?? "…"
        case "poll":
            return `📊 ${(p as { question?: string }).question ?? "Poll"}`
        case "checklist":
            return `☑ ${(p as { title?: string }).title ?? "Checklist"}`
        case "rating":
            return `⭐ ${(p as { question?: string }).question ?? "Rating"}`
        case "system":
            return (p as { text?: string }).text ?? "…"
        default:
            return "…"
    }
}

interface ReplyQuoteProps {
    parent: ParentMessage
    /** Accent color for the left border (sender's deterministic color) */
    accentColor?: string
    className?: string
}

export function ReplyQuote({ parent, accentColor = "var(--primary)", className }: ReplyQuoteProps) {
    return (
        <div
            className={cn("flex gap-2 rounded-md px-2 py-1 text-xs", className)}
            style={{ borderLeft: `3px solid ${accentColor}` }}
        >
            <div className="min-w-0">
                <p className="truncate font-semibold" style={{ color: accentColor }}>
                    {parent.user?.name ?? "Unknown"}
                </p>
                <p className="truncate text-muted-foreground">{quotePreview(parent)}</p>
            </div>
        </div>
    )
}

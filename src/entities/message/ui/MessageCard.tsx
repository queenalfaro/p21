import { format } from "date-fns"
import { cn } from "@/shared/lib/cn"
import type { MessageWithUser } from "../model/types"
import { ReplyQuote } from "./ReplyQuote"

// Deterministic colour per sender (like Telegram)
const SENDER_COLORS = ["#e17055", "#6c5ce7", "#00b894", "#0984e3", "#fd79a8", "#e67e22", "#8e44ad"]
function senderColor(userId: string) {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
        hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0
    }
    return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length]
}

function MiniAvatar({ user }: { user: MessageWithUser["user"] }) {
    const name = user?.name ?? "?"
    const letter = name.charAt(0).toUpperCase()
    if (user?.avatar_url) {
        return (
            <img
                src={user.avatar_url}
                alt={name}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
            />
        )
    }
    return (
        <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ backgroundColor: senderColor(user?.id ?? name) }}
        >
            {letter}
        </div>
    )
}

interface MessageCardProps {
    message: MessageWithUser
    isOwn: boolean
    /** The type-specific content rendered inside the bubble */
    contentSlot: React.ReactNode
    /** Called when the user taps the bubble to initiate a reply */
    onReply?: () => void
}

export function MessageCard({ message, isOwn, contentSlot, onReply }: MessageCardProps) {
    const time = message.created_at ? format(new Date(message.created_at), "HH:mm") : ""

    return (
        <div
            className={cn(
                "flex items-end gap-1.5 px-3 py-0.5",
                isOwn ? "flex-row-reverse" : "flex-row",
            )}
        >
            {/* Avatar — only for others */}
            {!isOwn && (
                <div className="mb-1 self-end">
                    <MiniAvatar user={message.user} />
                </div>
            )}

            <div
                className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    isOwn
                        ? "rounded-br-sm bg-own-bubble text-own-bubble-foreground"
                        : "rounded-bl-sm bg-muted text-foreground",
                    onReply && "cursor-pointer active:opacity-80",
                )}
                onClick={onReply}
            >
                {/* Sender name — only for others */}
                {!isOwn && message.user && (
                    <p
                        className="mb-0.5 text-xs font-semibold leading-none"
                        style={{ color: senderColor(message.user.id) }}
                    >
                        {message.user.name}
                    </p>
                )}

                {/* Reply quote — guard against array result from a misresolved self-join */}
                {message.parent && !Array.isArray(message.parent) && message.parent.id && (
                    <ReplyQuote
                        parent={message.parent}
                        accentColor={
                            message.parent.user_id
                                ? senderColor(message.parent.user_id)
                                : undefined
                        }
                        className={cn(
                            "mb-1.5",
                            isOwn ? "bg-black/8" : "bg-black/5",
                        )}
                    />
                )}

                {contentSlot}

                {/* Timestamp */}
                <p
                    className={cn(
                        "mt-0.5 text-right text-[10px] leading-none",
                        isOwn ? "text-own-bubble-foreground/60" : "text-muted-foreground",
                    )}
                >
                    {time}
                </p>
            </div>
        </div>
    )
}

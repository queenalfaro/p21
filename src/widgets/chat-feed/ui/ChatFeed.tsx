import { useEffect, useMemo, useRef, useState } from "react"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"
import { useMessages, useRealtimeMessages, MessageCard, SystemMessage } from "@/entities/message"
import type { MessageWithUser, TextPayload, SystemPayload } from "@/entities/message"
import { PollContent } from "@/features/chat/poll-voting"
import { ChecklistContent } from "@/features/chat/checklist-toggle"
import { RatingContent } from "@/features/chat/rating-vote"
import { getCurrentUserId } from "@/shared/lib/identity"

// Large starting index so we can prepend older messages without going negative
const START_INDEX = 100_000

function TextContent({ payload }: { payload: TextPayload }) {
    return <p className="whitespace-pre-wrap break-words text-sm">{payload.text}</p>
}

function stopProp(e: React.MouseEvent) {
    e.stopPropagation()
}

function renderContent(message: MessageWithUser, isOwn: boolean): React.ReactNode {
    const payload = message.payload as Record<string, unknown> | null
    switch (message.type) {
        case "text":
            return <TextContent payload={payload as TextPayload} />
        case "poll":
            return (
                <div onClick={stopProp}>
                    <PollContent messageId={message.id} payload={payload as import("@/entities/message").PollPayload} isOwn={isOwn} />
                </div>
            )
        case "checklist":
            return (
                <div onClick={stopProp}>
                    <ChecklistContent messageId={message.id} payload={payload as import("@/entities/message").ChecklistPayload} isOwn={isOwn} />
                </div>
            )
        case "rating":
            return (
                <div onClick={stopProp}>
                    <RatingContent messageId={message.id} payload={payload as import("@/entities/message").RatingPayload} isOwn={isOwn} />
                </div>
            )
        case "system":
            return null
        default:
            return <p className="text-sm italic opacity-70">Unsupported message</p>
    }
}

interface MessageItemProps {
    message: MessageWithUser
    currentUserId: string
    onReply: (message: MessageWithUser) => void
}

function MessageItem({ message, currentUserId, onReply }: MessageItemProps) {
    if (message.type === "system") {
        const payload = message.payload as SystemPayload
        return <SystemMessage text={payload.text ?? ""} />
    }

    const isOwn = message.user_id === currentUserId
    return (
        <MessageCard
            message={message}
            isOwn={isOwn}
            contentSlot={renderContent(message, isOwn)}
            onReply={() => onReply(message)}
        />
    )
}

interface ChatFeedProps {
    roomId: string
    onReply: (message: MessageWithUser) => void
}

export function ChatFeed({ roomId, onReply }: ChatFeedProps) {
    const currentUserId = getCurrentUserId()
    const virtuosoRef = useRef<VirtuosoHandle>(null)

    const { data, fetchPreviousPage, hasPreviousPage, isFetchingPreviousPage, isLoading, error } =
        useMessages(roomId)

    // Subscribe to realtime inserts → append to query cache
    useRealtimeMessages(roomId)

    // Flatten pages to chronological order.
    // pages[0] = oldest loaded (DESC), pages[last] = newest loaded (DESC).
    // Each page reversed → ASC; pages in order → oldest-to-newest.
    const allMessages = useMemo(
        () => (data?.pages ?? []).flatMap((page) => [...page].reverse()),
        [data?.pages],
    )

    // Track firstItemIndex for prepend scroll-anchor
    const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)
    const prevPagesCountRef = useRef(0)

    useEffect(() => {
        const pagesCount = data?.pages.length ?? 0
        if (pagesCount > prevPagesCountRef.current && prevPagesCountRef.current > 0) {
            // A new (older) page was prepended — adjust so Virtuoso doesn't jump
            setFirstItemIndex((idx) => idx - (data?.pages[0].length ?? 0))
        }
        prevPagesCountRef.current = pagesCount
    }, [data?.pages])

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
                <p className="text-destructive text-sm">
                    {error instanceof Error ? error.message : "Failed to load messages"}
                </p>
            </div>
        )
    }

    if (allMessages.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-1">
                <p className="text-muted-foreground text-sm">No messages yet</p>
                <p className="text-muted-foreground text-xs">Be the first to say something!</p>
            </div>
        )
    }

    return (
        <Virtuoso
            ref={virtuosoRef}
            className="flex-1"
            firstItemIndex={firstItemIndex}
            initialTopMostItemIndex={allMessages.length - 1}
            data={allMessages}
            followOutput={(isAtBottom) => (isAtBottom ? "smooth" : false)}
            startReached={() => {
                if (hasPreviousPage && !isFetchingPreviousPage) {
                    fetchPreviousPage()
                }
            }}
            components={{
                Header: () =>
                    isFetchingPreviousPage ? (
                        <div className="flex justify-center py-3">
                            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                        </div>
                    ) : null,
            }}
            itemContent={(_, message) => (
                <MessageItem
                    key={message.id}
                    message={message}
                    currentUserId={currentUserId}
                    onReply={onReply}
                />
            )}
        />
    )
}

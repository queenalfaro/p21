import { useState } from "react"
import { useParams } from "react-router"
import { usePermissions, useRealtimeRoom, useRealtimeMemberCount } from "@/entities/room"
import { useUserStore } from "@/entities/user"
import { RoomHeader } from "@/widgets/room-header"
import { ChatFeed } from "@/widgets/chat-feed"
import { SendMessage } from "@/features/chat"
import type { MessageWithUser } from "@/entities/message"
import { useMediaQuery } from "@/shared/lib/use-media-query"
import { AdminRoomLayout } from "./AdminRoomLayout"

export function RoomPage() {
    const { id } = useParams<{ id: string }>()
    const [replyTo, setReplyTo] = useState<MessageWithUser | null>(null)

    const user = useUserStore((s) => s.user)
    const { isAdmin, isLoaded } = usePermissions(id, user?.id)
    const isDesktop = useMediaQuery("(min-width: 1024px)")

    // Realtime subscriptions — keep room meta and member count live for all users
    useRealtimeRoom(id)
    useRealtimeMemberCount(id)

    if (!id) return null

    // Show desktop admin splitscreen when admin + wide enough viewport
    if (isLoaded && isAdmin && isDesktop) {
        return <AdminRoomLayout roomId={id} />
    }

    return (
        <div className="flex h-dvh flex-col overflow-hidden">
            <RoomHeader roomId={id} isAdmin={isAdmin} />
            <ChatFeed roomId={id} onReply={setReplyTo} />
            <SendMessage roomId={id} replyTo={replyTo} onClearReply={() => setReplyTo(null)} />
        </div>
    )
}

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { InfiniteData } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Tables } from "@/shared/api"
import type { MessageUser, MessageWithUser } from "../model/types"

export function useRealtimeMessages(roomId: string) {
    const queryClient = useQueryClient()

    useEffect(() => {
        const channel = supabase
            .channel(`room-messages-${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `room_id=eq.${roomId}`,
                },
                async (event) => {
                    const newMsg = event.new as Tables<"messages">

                    // Dedup: skip if message already in cache
                    const existing = queryClient.getQueryData<InfiniteData<MessageWithUser[]>>(
                        ["messages", roomId],
                    )
                    if (existing?.pages.some((p) => p.some((m) => m.id === newMsg.id))) return

                    // Fetch sender data
                    let user: MessageUser | null = null
                    if (newMsg.user_id) {
                        const { data } = await supabase
                            .from("users")
                            .select("id, name, username, avatar_url")
                            .eq("id", newMsg.user_id)
                            .maybeSingle()
                        user = data as MessageUser | null
                    }

                    // Fetch parent message so the reply quote renders correctly
                    let parent: MessageWithUser["parent"] = null
                    if (newMsg.parent_id) {
                        const { data: parentRow } = await supabase
                            .from("messages")
                            .select("id, type, payload, user_id, user:users(id, name)")
                            .eq("id", newMsg.parent_id)
                            .maybeSingle()
                        if (parentRow) {
                            const { user: parentUser, ...rest } = parentRow as {
                                user: { id: string; name: string } | null
                            } & typeof parentRow
                            parent = { ...rest, user: parentUser } as MessageWithUser["parent"]
                        }
                    }

                    const msgWithUser: MessageWithUser = { ...newMsg, user, parent }

                    // Prepend to last page (pages[last] = newest messages, DESC order).
                    // After flatMap+reverse in ChatFeed, new message appears at the bottom.
                    queryClient.setQueryData<InfiniteData<MessageWithUser[]>>(
                        ["messages", roomId],
                        (old) => {
                            if (!old) return old
                            const pages = [...old.pages]
                            const last = pages.length - 1
                            pages[last] = [msgWithUser, ...pages[last]]
                            return { ...old, pages }
                        },
                    )
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, queryClient])
}

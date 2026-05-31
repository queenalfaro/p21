import { useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Tables } from "@/shared/api"
import type { MessageUser, MessageWithUser, ParentMessage } from "../model/types"

const PAGE_SIZE = 50

export function useMessages(roomId: string) {
    return useInfiniteQuery({
        queryKey: ["messages", roomId],
        // Always refetch on mount so that messages missed while the subscription
        // was down (user on another page) are caught up immediately.
        staleTime: 0,
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam }) => {
            // Supabase self-join (messages!parent_id) is always one-to-many (children),
            // never many-to-one (parent). Fetch parents in a separate batch query instead.
            let query = supabase
                .from("messages")
                .select("*, user:users(id, name, username, avatar_url)")
                .eq("room_id", roomId)
                .order("created_at", { ascending: false })
                .limit(PAGE_SIZE)

            if (pageParam) {
                query = query.lt("created_at", pageParam)
            }

            const { data, error } = await query
            if (error) throw error

            const msgs = (data ?? []) as (Tables<"messages"> & { user: MessageUser | null })[]

            // Batch-fetch parent messages (at most 1 extra query per page)
            const parentIds = [...new Set(msgs.map((m) => m.parent_id).filter(Boolean))] as string[]
            const parentMap = new Map<string, ParentMessage>()
            if (parentIds.length > 0) {
                const { data: parents } = await supabase
                    .from("messages")
                    .select("id, type, payload, user_id, user:users(id, name)")
                    .in("id", parentIds)
                ;(parents ?? []).forEach((p) => {
                    const { user, ...rest } = p as typeof p & { user: { id: string; name: string } | null }
                    parentMap.set(p.id, { ...rest, user } as ParentMessage)
                })
            }

            return msgs.map((m) => ({
                ...m,
                parent: m.parent_id ? (parentMap.get(m.parent_id) ?? null) : null,
            })) as MessageWithUser[]
        },
        getPreviousPageParam: (firstPage) =>
            firstPage.length === PAGE_SIZE
                ? firstPage[firstPage.length - 1].created_at
                : undefined,
        getNextPageParam: () => undefined,
    })
}

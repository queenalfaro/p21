import { useInfiniteQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { MessageWithUser } from "../model/types"

const PAGE_SIZE = 50

export function useMessages(roomId: string) {
    return useInfiniteQuery({
        queryKey: ["messages", roomId],
        initialPageParam: null as string | null,
        queryFn: async ({ pageParam }) => {
            let query = supabase
                .from("messages")
                .select("*, user:users(id, name, username, avatar_url), parent:messages!parent_id(id, type, payload, user_id, user:users(id, name))")
                .eq("room_id", roomId)
                .order("created_at", { ascending: false })
                .limit(PAGE_SIZE)

            if (pageParam) {
                query = query.lt("created_at", pageParam)
            }

            const { data, error } = await query
            if (error) throw error
            return (data ?? []) as MessageWithUser[]
        },
        // When the user scrolls to the top we fetch older messages.
        // firstPage is pages[0] which, after prepending, is the oldest loaded page.
        getPreviousPageParam: (firstPage) =>
            firstPage.length === PAGE_SIZE
                ? firstPage[firstPage.length - 1].created_at
                : undefined,
        getNextPageParam: () => undefined,
    })
}

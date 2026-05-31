import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { PollPayload, ChecklistPayload, RatingPayload } from "@/entities/message"

export type CustomMessagePayload = PollPayload | ChecklistPayload | RatingPayload

export type CustomMessage = {
    id: string
    type: "poll" | "checklist" | "rating"
    payload: CustomMessagePayload
    created_at: string
    user: { name: string } | null
}

export function useCustomMessages(roomId: string) {
    return useQuery({
        queryKey: ["messages", "custom", roomId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("id, type, payload, created_at, user:users(name)")
                .eq("room_id", roomId)
                .in("type", ["poll", "checklist", "rating"])
                .order("created_at", { ascending: true })
            if (error) throw error
            return (data ?? []) as CustomMessage[]
        },
        staleTime: 30_000,
        refetchInterval: 30_000,
    })
}

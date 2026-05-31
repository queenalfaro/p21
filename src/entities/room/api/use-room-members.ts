import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Enums, Json } from "@/shared/api"

export type RoomMemberWithUser = {
    room_id: string
    user_id: string
    role: Enums<"room_role"> | null
    permissions: Json | null
    joined_at: string | null
    user: {
        id: string
        name: string
        username: string | null
        avatar_url: string | null
    } | null
}

export function useRoomMembers(roomId: string) {
    return useQuery({
        queryKey: ["room_members", "list", roomId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("room_members")
                .select("*, user:users(id, name, username, avatar_url)")
                .eq("room_id", roomId)
                .order("joined_at", { ascending: true })
            if (error) throw error
            return (data ?? []) as RoomMemberWithUser[]
        },
        staleTime: 30_000,
    })
}

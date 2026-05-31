import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Tables } from "@/shared/api"

export type RoomMembership = Tables<"room_members">

export function useGetMembership(roomId: string | undefined, userId: string | undefined) {
    return useQuery({
        queryKey: ["room_members", roomId, userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("room_members")
                .select()
                .eq("room_id", roomId!)
                .eq("user_id", userId!)
                .maybeSingle()
            if (error) throw error
            return data as RoomMembership | null
        },
        enabled: !!roomId && !!userId,
        staleTime: 60_000,
    })
}

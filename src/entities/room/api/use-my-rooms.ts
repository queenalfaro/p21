import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Room } from "../model/types"

export function useMyRooms(userId: string) {
    return useQuery({
        queryKey: ["rooms", "my", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("room_members")
                .select("rooms(*)")
                .eq("user_id", userId)
                .order("joined_at", { ascending: false })
            if (error) throw error
            return (data ?? [])
                .map((item) => item.rooms as Room | null)
                .filter((r): r is Room => r !== null)
        },
        enabled: !!userId,
    })
}

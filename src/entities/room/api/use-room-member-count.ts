import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"

export function useRoomMemberCount(roomId: string | undefined) {
    return useQuery({
        queryKey: ["room_members", "count", roomId],
        queryFn: async () => {
            const { count, error } = await supabase
                .from("room_members")
                .select("*", { count: "exact", head: true })
                .eq("room_id", roomId!)
            if (error) throw error
            return count ?? 0
        },
        enabled: !!roomId,
        staleTime: 60_000,
    })
}

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Room } from "../model/types"

export function useGetRoomByRoomname(roomname: string | undefined) {
    return useQuery({
        queryKey: ["rooms", "roomname", roomname],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("rooms")
                .select()
                .eq("roomname", roomname!)
                .maybeSingle()
            if (error) throw error
            return data as Room | null
        },
        enabled: !!roomname,
        staleTime: 30_000,
    })
}

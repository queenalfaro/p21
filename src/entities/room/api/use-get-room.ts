import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Room } from "../model/types"

export function useGetRoom(id: string | undefined) {
    return useQuery({
        queryKey: ["rooms", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("rooms")
                .select()
                .eq("id", id!)
                .single()
            if (error) throw error
            return data as Room
        },
        enabled: !!id,
        staleTime: 30_000,
    })
}

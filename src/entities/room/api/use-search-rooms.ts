import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"

export function useSearchRooms(query: string) {
    return useQuery({
        queryKey: ["rooms", "search", query],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("rooms")
                .select("*")
                .or(`name.ilike.%${query}%,roomname.ilike.%${query}%`)
                .order("created_at", { ascending: false })
                .limit(20)
            if (error) throw error
            return data ?? []
        },
        enabled: query.length >= 1,
        staleTime: 30_000,
    })
}

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { User } from "../model/types"

export function useGetUser(userId: string) {
    return useQuery<User | null>({
        queryKey: ["user", userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .maybeSingle()
            if (error) throw error
            return data
        },
        enabled: !!userId,
        staleTime: Infinity, // user profile doesn't change between sessions
    })
}

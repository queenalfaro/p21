import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { MessageInteraction } from "../model/types"

export function useInteractions(messageId: string) {
    return useQuery({
        queryKey: ["interactions", messageId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("message_interactions")
                .select("*")
                .eq("message_id", messageId)
            if (error) throw error
            return (data ?? []) as MessageInteraction[]
        },
        staleTime: 5_000,
    })
}

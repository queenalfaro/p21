import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Tables } from "@/shared/api"
import type { MessageInteraction } from "../model/types"

export function useInteractions(messageId: string) {
    const queryClient = useQueryClient()

    useEffect(() => {
        const channel = supabase
            .channel(`interactions-${messageId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "message_interactions",
                    filter: `message_id=eq.${messageId}`,
                },
                (event) => {
                    if (event.eventType === "INSERT") {
                        const row = event.new as Tables<"message_interactions">
                        queryClient.setQueryData<MessageInteraction[]>(
                            ["interactions", messageId],
                            (old) => {
                                if (!old) return [row]
                                if (old.some((i) => i.id === row.id)) return old
                                return [...old, row]
                            },
                        )
                    } else if (event.eventType === "UPDATE") {
                        const row = event.new as Tables<"message_interactions">
                        queryClient.setQueryData<MessageInteraction[]>(
                            ["interactions", messageId],
                            (old) => {
                                if (!old) return [row]
                                return old.map((i) => (i.id === row.id ? row : i))
                            },
                        )
                    }
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [messageId, queryClient])

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
        staleTime: 30_000,
    })
}

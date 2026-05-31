import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Json } from "@/shared/api"
import { getCurrentUserId } from "@/shared/lib/identity"

interface InteractPayload {
    messageId: string
    interactionType: "vote" | "check" | "rate"
    value: Json
}

export function useInteract() {
    const queryClient = useQueryClient()
    const userId = getCurrentUserId()

    return useMutation({
        mutationFn: async ({ messageId, interactionType, value }: InteractPayload) => {
            const { error } = await supabase.from("message_interactions").upsert(
                {
                    message_id: messageId,
                    user_id: userId,
                    interaction_type: interactionType,
                    value,
                },
                { onConflict: "message_id,user_id,interaction_type" },
            )
            if (error) throw error
        },
        onSuccess: (_, { messageId }) => {
            queryClient.invalidateQueries({ queryKey: ["interactions", messageId] })
        },
    })
}

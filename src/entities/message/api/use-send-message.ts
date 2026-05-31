import { useMutation } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import { getCurrentUserId } from "@/shared/lib/identity"
import type { TablesInsert } from "@/shared/api"

type SendPayload = Pick<TablesInsert<"messages">, "type" | "payload" | "parent_id">

export function useSendMessage(roomId: string) {
    const userId = getCurrentUserId()

    return useMutation({
        mutationFn: async (payload: SendPayload) => {
            const { error } = await supabase.from("messages").insert({
                room_id: roomId,
                user_id: userId,
                ...payload,
            })
            if (error) throw error
        },
    })
}

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Enums } from "@/shared/api"

interface UpdateMemberPayload {
    userId: string
    role?: Enums<"room_role">
    permissions?: string[]
}

export function useUpdateMember(roomId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ userId, role, permissions }: UpdateMemberPayload) => {
            const { error } = await supabase
                .from("room_members")
                .update({ role, permissions })
                .eq("room_id", roomId)
                .eq("user_id", userId)
            if (error) throw error
        },
        onSuccess: (_, { userId }) => {
            queryClient.invalidateQueries({ queryKey: ["room_members", "list", roomId] })
            queryClient.invalidateQueries({ queryKey: ["room_members", roomId, userId] })
        },
    })
}

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"

export function useRemoveMember(roomId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (userId: string) => {
            const { error } = await supabase
                .from("room_members")
                .delete()
                .eq("room_id", roomId)
                .eq("user_id", userId)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["room_members", "list", roomId] })
            queryClient.invalidateQueries({ queryKey: ["room_members", "count", roomId] })
        },
    })
}

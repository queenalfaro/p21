import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"

export function useJoinRoom(userId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (roomId: string) => {
            const { error } = await supabase.from("room_members").insert({
                room_id: roomId,
                user_id: userId,
                role: "user",
            })
            // Ignore unique-constraint error (user already a member)
            if (error && !error.message.includes("duplicate key")) throw error
        },
        onSuccess: (_data, roomId) => {
            queryClient.invalidateQueries({ queryKey: ["rooms", "my"] })
            queryClient.invalidateQueries({ queryKey: ["room_members", roomId] })
        },
    })
}

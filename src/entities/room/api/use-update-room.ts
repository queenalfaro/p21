import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { TablesUpdate } from "@/shared/api"

export function useUpdateRoom(roomId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (input: TablesUpdate<"rooms">) => {
            const { data, error } = await supabase
                .from("rooms")
                .update(input)
                .eq("id", roomId)
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["rooms", roomId], data)
            queryClient.invalidateQueries({ queryKey: ["rooms", "my"] })
        },
    })
}

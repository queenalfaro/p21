import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { TablesInsert } from "@/shared/api"
import type { Room } from "../model/types"

type CreateRoomPayload = Pick<TablesInsert<"rooms">, "name" | "roomname" | "description" | "starts_at" | "avatar_url">

export function useCreateRoom(userId: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (payload: CreateRoomPayload) => {
            const { data: room, error: roomError } = await supabase
                .from("rooms")
                .insert(payload)
                .select()
                .single()
            if (roomError) throw roomError

            const { error: memberError } = await supabase.from("room_members").insert({
                room_id: room.id,
                user_id: userId,
                role: "admin",
                permissions: ["manage_room", "pin_messages", "manage_members"],
            })
            if (memberError) throw memberError

            return room as Room
        },
        onSuccess: (room) => {
            queryClient.setQueryData(["rooms", room.id], room)
            queryClient.invalidateQueries({ queryKey: ["rooms", "my"] })
        },
    })
}

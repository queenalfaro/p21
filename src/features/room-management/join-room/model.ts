import { z } from "zod"

export const joinByRoomnameSchema = z.object({
    roomname: z.string().min(1, "Room handle is required").max(50),
})

export type JoinByRoomnameValues = z.infer<typeof joinByRoomnameSchema>

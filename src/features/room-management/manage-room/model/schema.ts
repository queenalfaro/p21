import { z } from "zod"

export const editRoomSchema = z.object({
    name: z.string().min(1, "Required").max(255),
    description: z.string().max(1000).optional(),
    avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    status: z.enum(["draft", "active", "completed"]),
    starts_at: z.string().optional(),
    ends_at: z.string().optional(),
})

export type EditRoomValues = z.infer<typeof editRoomSchema>

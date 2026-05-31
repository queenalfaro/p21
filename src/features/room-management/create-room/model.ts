import { z } from "zod"

export const createRoomSchema = z.object({
    name: z.string().min(1, "Room name is required").max(255),
    roomname: z
        .string()
        .min(1, "Room handle is required")
        .max(50)
        .regex(/^[a-z0-9][a-z0-9_-]*$/, "Lowercase letters, numbers, hyphens and underscores only"),
    description: z.string().max(1000).optional(),
    avatar_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    starts_at: z.string().optional(),
})

export type CreateRoomValues = z.infer<typeof createRoomSchema>

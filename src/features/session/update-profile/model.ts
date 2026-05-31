import { z } from "zod"

export const updateProfileSchema = z.object({
    name: z.string().min(1, "Name is required").max(255),
    username: z
        .string()
        .max(32, "Max 32 characters")
        .regex(/^[a-z0-9_]*$/, "Lowercase letters, digits and _ only")
        .optional()
        .or(z.literal("")),
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>

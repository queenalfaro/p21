import { z } from "zod"

export const roadmapSegmentSchema = z.object({
    id: z.string(),
    title: z.string().min(1).max(120),
    notes: z.string().max(1000).optional().default(""),
    order: z.number().int().nonnegative(),
    // Status lifecycle: upcoming → active → done
    // Only one segment can be 'active' at a time.
    status: z.enum(["upcoming", "active", "done"]),
    // Set server-side (Date.now().toString()) when admin activates the segment.
    // ISO string. Absent for 'upcoming' segments.
    activatedAt: z.string().datetime().optional(),
})

export type RoadmapSegment = z.infer<typeof roadmapSegmentSchema>

export const roadmapSchema = z.array(roadmapSegmentSchema)
export type Roadmap = z.infer<typeof roadmapSchema>

import type { Json } from "@/shared/api"
import { roadmapSchema, type Roadmap } from "../model/types"

/**
 * Safely parses rooms.settings.roadmap from a JSON value.
 * Returns an empty array if the value is absent or malformed.
 */
export function parseRoadmap(settings: Json | null | undefined): Roadmap {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return []
    const raw = (settings as Record<string, unknown>).roadmap
    if (!Array.isArray(raw)) return []
    const result = roadmapSchema.safeParse(raw)
    return result.success ? result.data : []
}

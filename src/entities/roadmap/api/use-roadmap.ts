import { useGetRoom } from "@/entities/room"
import { parseRoadmap } from "../lib/parse"
import type { Roadmap } from "../model/types"

/**
 * Derives the roadmap from rooms.settings.roadmap.
 * Piggybacks on the existing useGetRoom query — no extra network request.
 */
export function useRoadmap(roomId: string | undefined): {
    roadmap: Roadmap
    isLoading: boolean
} {
    const { data: room, isLoading } = useGetRoom(roomId)
    const roadmap = parseRoadmap(room?.settings ?? null)
    return { roadmap, isLoading }
}

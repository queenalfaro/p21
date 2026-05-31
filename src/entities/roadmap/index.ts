// Public API of the roadmap entity
// Future: AI assistant per segment — wire here when implementing

export { useRoadmap } from "./api/use-roadmap"
export { parseRoadmap } from "./lib/parse"
export { getSegmentIntervals } from "./lib/segments"
export type { SegmentInterval } from "./lib/segments"
export type { RoadmapSegment, Roadmap } from "./model/types"
export { roadmapSegmentSchema, roadmapSchema } from "./model/types"

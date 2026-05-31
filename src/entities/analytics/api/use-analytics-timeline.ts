import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/shared/api"
import type { Tables } from "@/shared/api"

export type AnalyticsTimelineBucket = Tables<"analytics_timeline">

export function useAnalyticsTimeline(roomId: string) {
    return useQuery({
        queryKey: ["analytics_timeline", roomId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("analytics_timeline")
                .select("*")
                .eq("room_id", roomId)
                .order("bucket_time", { ascending: true })
            if (error) throw error
            return (data ?? []) as AnalyticsTimelineBucket[]
        },
        refetchInterval: 20_000,
        staleTime: 15_000,
    })
}

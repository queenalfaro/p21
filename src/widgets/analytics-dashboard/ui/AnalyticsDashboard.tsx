import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    AreaChart, Area,
    XAxis, YAxis,
    CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowExpand01Icon, ArrowShrink01Icon, ArrowRight01Icon, Analytics01Icon } from "@hugeicons/core-free-icons"
import { useAnalyticsTimeline, useCustomMessages, useLiveAudience } from "@/entities/analytics"
import type { CustomMessage } from "@/entities/analytics"
import { useGetRoom } from "@/entities/room"
import { useRoadmap, getSegmentIntervals } from "@/entities/roadmap"
import type { PollPayload, ChecklistPayload, RatingPayload, MessageInteraction } from "@/entities/message"
import { supabase } from "@/shared/api"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/cn"

// ── constants ──────────────────────────────────────────────────────────────────

// How often we sample the live audience into the chart's live tail
const LIVE_SAMPLE_MS = 5_000
// Max samples to keep in the live tail buffer (10 min at 5 s interval)
const MAX_LIVE_SAMPLES = 120

// ── helpers ────────────────────────────────────────────────────────────────────

function fmtTime(ts: number): string {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// ── chart tooltip ──────────────────────────────────────────────────────────────

interface ChartTooltipProps {
    active?: boolean
    payload?: Array<{ dataKey?: string | number; color?: string; value?: number | string; name?: string }>
    label?: number | string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-lg border bg-background p-2 text-xs shadow-md">
            <p className="font-medium mb-1">{typeof label === "number" ? fmtTime(label) : label}</p>
            {payload.map((p, i) => (
                <p key={String(p.dataKey ?? i)} style={{ color: p.color }}>
                    {p.name}: {p.value}
                </p>
            ))}
        </div>
    )
}

// ── custom message marker ──────────────────────────────────────────────────────

interface MessagePinProps {
    viewBox?: { x: number; y: number; width: number; height: number }
    isSelected: boolean
    msgType: string
    onSelect: () => void
}

const TYPE_LABEL: Record<string, string> = { poll: "P", checklist: "C", rating: "R" }

function MessagePin({ viewBox, isSelected, msgType, onSelect }: MessagePinProps) {
    if (!viewBox) return null
    const { x, y } = viewBox
    return (
        <g
            transform={`translate(${x}, ${y + 2})`}
            onClick={(e) => { e.stopPropagation(); onSelect() }}
            style={{ cursor: "pointer" }}
        >
            <circle r={6} fill={isSelected ? "#7c3aed" : "#a78bfa"} stroke="#fff" strokeWidth={1} />
            <text x={0} y={4} textAnchor="middle" fontSize={7} fill="white" fontWeight="bold">
                {TYPE_LABEL[msgType] ?? "?"}
            </text>
        </g>
    )
}

// ── read-only message stats ────────────────────────────────────────────────────

function PollStats({ payload, interactions }: { payload: PollPayload; interactions: MessageInteraction[] }) {
    const votes = interactions.filter((i) => i.interaction_type === "vote")
    const total = votes.length || 1
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium">{payload.question}</p>
            <p className="text-[10px] text-muted-foreground">{votes.length} votes</p>
            {payload.options.map((opt, idx) => {
                const count = votes.filter(
                    (v) => (v.value as { option?: number } | null)?.option === idx,
                ).length
                return (
                    <div key={idx} className="space-y-0.5">
                        <p className="text-xs">{opt}</p>
                        <div className="flex items-center gap-1.5">
                            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ width: `${Math.round((count / total) * 100)}%` }}
                                />
                            </div>
                            <span className="text-[10px] w-7 text-right text-muted-foreground">
                                {Math.round((count / total) * 100)}%
                            </span>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function RatingStats({ payload, interactions }: { payload: RatingPayload; interactions: MessageInteraction[] }) {
    const ratings = interactions.filter((i) => i.interaction_type === "rate")
    const total = ratings.length
    const sum = ratings.reduce((acc, r) => acc + ((r.value as { stars?: number } | null)?.stars ?? 0), 0)
    const avg = total > 0 ? (sum / total).toFixed(1) : "—"
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium">{payload.question}</p>
            <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{avg}</span>
                <span className="text-xs text-muted-foreground">/ 5 · {total} votes</span>
            </div>
            {[5, 4, 3, 2, 1].map((star) => {
                const count = ratings.filter(
                    (r) => (r.value as { stars?: number } | null)?.stars === star,
                ).length
                return (
                    <div key={star} className="flex items-center gap-1.5">
                        <span className="text-[10px] text-amber-400 w-10">{"★".repeat(star)}</span>
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full bg-amber-400 rounded-full"
                                style={{ width: `${total ? Math.round((count / total) * 100) : 0}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-4 text-right">{count}</span>
                    </div>
                )
            })}
        </div>
    )
}

function ChecklistStats({ payload, interactions }: { payload: ChecklistPayload; interactions: MessageInteraction[] }) {
    const checks = interactions.filter((i) => i.interaction_type === "check")
    const total = checks.length
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium">{payload.title}</p>
            <p className="text-[10px] text-muted-foreground">{total} participants</p>
            {payload.items.map((item, idx) => {
                const count = checks.filter(
                    (c) => ((c.value as { checked?: number[] } | null)?.checked ?? []).includes(idx),
                ).length
                return (
                    <div key={idx} className="flex items-center gap-1.5">
                        <span className="text-xs flex-1 truncate">{item}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                            {count}/{total}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

function MessageStats({
    message,
    interactions,
}: {
    message: CustomMessage
    interactions: MessageInteraction[]
}) {
    if (message.type === "poll")
        return <PollStats payload={message.payload as PollPayload} interactions={interactions} />
    if (message.type === "rating")
        return <RatingStats payload={message.payload as RatingPayload} interactions={interactions} />
    if (message.type === "checklist")
        return <ChecklistStats payload={message.payload as ChecklistPayload} interactions={interactions} />
    return null
}

// ── live tail point type ───────────────────────────────────────────────────────

interface LivePoint {
    ts: number
    online: number
    engaged: number
    distracted: number
    unknown: number
}

// ── main component ─────────────────────────────────────────────────────────────

interface AnalyticsDashboardProps {
    roomId: string
    onCollapse?: () => void
    onExpandToggle?: () => void
    isExpanded?: boolean
}

export function AnalyticsDashboard({
    roomId,
    onCollapse,
    onExpandToggle,
    isExpanded = false,
}: AnalyticsDashboardProps) {
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

    const { data: timeline = [], isLoading: timelineLoading } = useAnalyticsTimeline(roomId)
    const { data: customMessages = [] } = useCustomMessages(roomId)
    const { data: room } = useGetRoom(roomId)
    const { roadmap } = useRoadmap(roomId)
    const liveAudience = useLiveAudience(roomId)

    // ── live tail accumulation ───────────────────────────────────────────────
    // We sample the Realtime-derived liveAudience into a rolling buffer every
    // LIVE_SAMPLE_MS. This creates a smooth "live right edge" on both charts
    // that extends beyond the last cron-snapshot bucket.
    const liveTailRef = useRef<LivePoint[]>([])
    const [liveTail, setLiveTail] = useState<LivePoint[]>([])

    useEffect(() => {
        const id = setInterval(() => {
            const point: LivePoint = {
                ts: Date.now(),
                online: liveAudience.online,
                engaged: liveAudience.engaged,
                distracted: liveAudience.distracted,
                unknown: liveAudience.unknown,
            }
            const next = [...liveTailRef.current, point].slice(-MAX_LIVE_SAMPLES)
            liveTailRef.current = next
            setLiveTail(next)
        }, LIVE_SAMPLE_MS)
        return () => clearInterval(id)
    // liveAudience is used by reference inside the interval — re-subscribe when roomId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId])

    // Interactions for the selected message
    const { data: selectedInteractions = [] } = useQuery({
        queryKey: ["interactions", selectedMessageId ?? ""],
        queryFn: async () => {
            if (!selectedMessageId) return []
            const { data, error } = await supabase
                .from("message_interactions")
                .select("*")
                .eq("message_id", selectedMessageId)
            if (error) throw error
            return (data ?? []) as MessageInteraction[]
        },
        enabled: !!selectedMessageId,
        staleTime: 5_000,
        refetchInterval: selectedMessageId ? 10_000 : false,
    })

    // ── chart data ───────────────────────────────────────────────────────────

    // Historical buckets from analytics_timeline (cron snapshots, 1/min)
    const histOnline = timeline.map((b) => ({
        ts: new Date(b.bucket_time).getTime(),
        online: b.online_count ?? 0,
    }))
    const histPulse = timeline.map((b) => {
        const e = b.engaged_count ?? 0
        const d = b.distracted_count ?? 0
        const u = b.unknown_count ?? 0
        const total = e + d + u || 1
        return {
            ts: new Date(b.bucket_time).getTime(),
            engaged: Math.round((e / total) * 100),
            distracted: Math.round((d / total) * 100),
            unknown: Math.round((u / total) * 100),
        }
    })

    // Live tail mapped to the same shape as historical data
    const tailOnline = liveTail.map((p) => ({ ts: p.ts, online: p.online }))
    const tailPulse = liveTail.map((p) => {
        const total = p.engaged + p.distracted + p.unknown || 1
        return {
            ts: p.ts,
            engaged: Math.round((p.engaged / total) * 100),
            distracted: Math.round((p.distracted / total) * 100),
            unknown: Math.round((p.unknown / total) * 100),
        }
    })

    // Merge: historical first, then live tail (deduplicated by last hist ts)
    const lastHistTs = histOnline.at(-1)?.ts ?? 0
    const filteredTailOnline = tailOnline.filter((p) => p.ts > lastHistTs)
    const filteredTailPulse = tailPulse.filter((p) => p.ts > lastHistTs)

    const onlineData = [...histOnline, ...filteredTailOnline]
    const pulseData = [...histPulse, ...filteredTailPulse]

    // Domain
    const domainStart = room?.starts_at
        ? new Date(room.starts_at).getTime()
        : (onlineData[0]?.ts ?? 0)
    const domainEnd = onlineData.at(-1)?.ts ?? domainStart + 60_000

    const hasData = onlineData.length > 0

    // ── roadmap segment bands ─────────────────────────────────────────────────
    // ReferenceArea for each activated roadmap segment (only done/active).
    // Date.now() is called inside getSegmentIntervals (not passed from render) to avoid
    // the react-hooks/purity lint rule about calling impure functions during render.
    const segmentIntervals = getSegmentIntervals(roadmap)

    // Alternating fill colors for adjacent bands
    const BAND_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]

    function toggleMessage(id: string) {
        setSelectedMessageId((prev) => (prev === id ? null : id))
    }

    const sharedXAxis = (
        <XAxis
            dataKey="ts"
            type="number"
            domain={[domainStart, domainEnd]}
            scale="time"
            tickCount={4}
            tickFormatter={fmtTime}
            tick={{ fontSize: 9 }}
        />
    )

    const sharedReferenceLines = customMessages.map((m) => (
        <ReferenceLine
            key={m.id}
            x={new Date(m.created_at).getTime()}
            stroke="#7c3aed"
            strokeDasharray="3 3"
            strokeOpacity={0.7}
            label={
                <MessagePin
                    isSelected={selectedMessageId === m.id}
                    msgType={m.type}
                    onSelect={() => toggleMessage(m.id)}
                />
            }
        />
    ))

    // Roadmap bands — rendered as semi-transparent ReferenceArea strips
    const sharedSegmentBands = segmentIntervals.map((seg, i) => (
        <ReferenceArea
            key={seg.id}
            x1={seg.startMs}
            x2={seg.endMs ?? domainEnd}
            fill={BAND_COLORS[i % BAND_COLORS.length]}
            fillOpacity={0.06}
            stroke={BAND_COLORS[i % BAND_COLORS.length]}
            strokeOpacity={0.25}
            strokeWidth={1}
            label={undefined} // title shown in legend below chart
        />
    ))

    return (
        <div className="flex h-full flex-col overflow-hidden border-l bg-background">
            {/* Header */}
            <div className="flex items-center gap-2 border-b px-3 py-2 shrink-0">
                <HugeiconsIcon icon={Analytics01Icon} size={16} className="text-muted-foreground" />
                <h2 className="flex-1 text-sm font-semibold">Analytics</h2>
                {onExpandToggle && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onExpandToggle}
                        aria-label={isExpanded ? "Restore layout" : "Expand panel"}
                        title={isExpanded ? "Restore layout" : "Expand panel"}
                    >
                        <HugeiconsIcon
                            icon={isExpanded ? ArrowShrink01Icon : ArrowExpand01Icon}
                            size={16}
                        />
                    </Button>
                )}
                {onCollapse && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onCollapse}
                        aria-label="Collapse panel"
                        title="Collapse panel"
                    >
                        <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                    </Button>
                )}
            </div>

            {/* Live counts strip */}
            {hasData && (
                <div className="grid grid-cols-4 border-b divide-x shrink-0">
                    {[
                        { label: "Online",     value: liveAudience.online,     color: "text-blue-500"  },
                        { label: "Engaged",    value: liveAudience.engaged,    color: "text-green-500" },
                        { label: "Distracted", value: liveAudience.distracted, color: "text-orange-400"},
                        { label: "Unknown",    value: liveAudience.unknown,    color: "text-slate-400" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="flex flex-col items-center py-2 gap-0.5">
                            <span className={cn("text-lg font-bold leading-none", color)}>{value}</span>
                            <span className="text-[9px] text-muted-foreground">{label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {timelineLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : !hasData ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <HugeiconsIcon
                            icon={Analytics01Icon}
                            size={32}
                            className="text-muted-foreground/40 mb-3"
                        />
                        <p className="text-sm text-muted-foreground">No analytics yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                            Appears when the room is set to active
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Roadmap segment legend (if any activated) */}
                        {segmentIntervals.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Agenda
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {segmentIntervals.map((seg, i) => (
                                        <span
                                            key={seg.id}
                                            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                                            style={{
                                                backgroundColor: `${BAND_COLORS[i % BAND_COLORS.length]}20`,
                                                color: BAND_COLORS[i % BAND_COLORS.length],
                                            }}
                                        >
                                            <span
                                                className="inline-block h-1.5 w-1.5 rounded-full"
                                                style={{ backgroundColor: BAND_COLORS[i % BAND_COLORS.length] }}
                                            />
                                            {seg.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 1. Online count */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Online
                            </p>
                            <ResponsiveContainer width="100%" height={100}>
                                <AreaChart data={onlineData} margin={{ top: 10, right: 4, bottom: 0, left: -24 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                                    {sharedSegmentBands}
                                    {sharedXAxis}
                                    <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="online"
                                        stroke="#3b82f6"
                                        fill="#3b82f6"
                                        fillOpacity={0.15}
                                        strokeWidth={2}
                                        name="Online"
                                        dot={false}
                                        activeDot={{ r: 3 }}
                                    />
                                    {sharedReferenceLines}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 2. Engagement pulse — stacked % */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Engagement Pulse
                            </p>
                            <div className="flex gap-3 text-[10px] text-muted-foreground mb-1">
                                <span className="flex items-center gap-1">
                                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                                    Engaged
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
                                    Distracted
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
                                    Unknown
                                </span>
                            </div>
                            <ResponsiveContainer width="100%" height={100}>
                                <AreaChart data={pulseData} margin={{ top: 10, right: 4, bottom: 0, left: -24 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                                    {sharedSegmentBands}
                                    {sharedXAxis}
                                    <YAxis
                                        tick={{ fontSize: 9 }}
                                        domain={[0, 100]}
                                        tickFormatter={(v) => `${v}`}
                                    />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="engaged"
                                        stackId="1"
                                        stroke="#22c55e"
                                        fill="#22c55e"
                                        fillOpacity={0.5}
                                        strokeWidth={1.5}
                                        name="Engaged"
                                        dot={false}
                                        activeDot={{ r: 3 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="distracted"
                                        stackId="1"
                                        stroke="#fb923c"
                                        fill="#fb923c"
                                        fillOpacity={0.5}
                                        strokeWidth={1.5}
                                        name="Distracted"
                                        dot={false}
                                        activeDot={{ r: 3 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="unknown"
                                        stackId="1"
                                        stroke="#94a3b8"
                                        fill="#94a3b8"
                                        fillOpacity={0.35}
                                        strokeWidth={1.5}
                                        name="Unknown"
                                        dot={false}
                                        activeDot={{ r: 3 }}
                                    />
                                    {sharedReferenceLines}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 3. Custom message stats */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Custom Messages
                            </p>
                            {customMessages.length === 0 ? (
                                <p className="text-xs text-muted-foreground/60">
                                    No custom messages in this room yet
                                </p>
                            ) : (
                                customMessages.map((msg) => {
                                    const isSelected = selectedMessageId === msg.id
                                    const label =
                                        (msg.payload as { question?: string; title?: string })?.question ??
                                        (msg.payload as { title?: string })?.title ??
                                        "—"
                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "rounded-lg border p-2.5 cursor-pointer transition-colors",
                                                isSelected
                                                    ? "border-primary/50 bg-primary/5"
                                                    : "hover:bg-muted/40",
                                            )}
                                            onClick={() => toggleMessage(msg.id)}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-medium px-1.5 py-0.5 rounded capitalize",
                                                        msg.type === "poll" && "bg-blue-500/15 text-blue-600",
                                                        msg.type === "rating" && "bg-amber-500/15 text-amber-600",
                                                        msg.type === "checklist" && "bg-emerald-500/15 text-emerald-600",
                                                    )}
                                                >
                                                    {msg.type}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {fmtTime(new Date(msg.created_at).getTime())}
                                                </span>
                                                {msg.user?.name && (
                                                    <span className="text-[10px] text-muted-foreground ml-auto truncate">
                                                        {msg.user.name}
                                                    </span>
                                                )}
                                            </div>

                                            {isSelected ? (
                                                <MessageStats
                                                    message={msg}
                                                    interactions={selectedInteractions}
                                                />
                                            ) : (
                                                <p className="text-xs text-foreground/80 truncate">{label}</p>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

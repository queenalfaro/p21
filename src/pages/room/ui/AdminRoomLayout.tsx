import { useState } from "react"
import { Group, Panel, Separator, useGroupRef, usePanelRef } from "react-resizable-panels"
import { ChatFeed } from "@/widgets/chat-feed"
import { RoomManagementPanel } from "@/widgets/room-management"
import { AnalyticsDashboard } from "@/widgets/analytics-dashboard"
import { RoomHeader } from "@/widgets/room-header"
import { SendMessage } from "@/features/chat"
import type { MessageWithUser } from "@/entities/message"
import { cn } from "@/shared/lib/cn"

// ── types ─────────────────────────────────────────────────────────────────────

type LayoutMode = "default" | "left-full" | "right-full" | "both-expanded"

// Sizes by mode (management, chat, analytics) — must sum to 100
const SIZES: Record<LayoutMode, Record<string, number>> = {
    default: { management: 33, chat: 34, analytics: 33 },
    "left-full": { management: 61, chat: 34, analytics: 5 },
    "right-full": { management: 5, chat: 34, analytics: 61 },
    "both-expanded": { management: 33, chat: 34, analytics: 33 },
}

// Collapsed threshold: a panel at ≤ 6% is considered collapsed (tab strip)
const COLLAPSED_THRESHOLD = 6

// ── vertical tab ──────────────────────────────────────────────────────────────

function VerticalTab({
    label,
    side,
    onClick,
}: {
    label: string
    side: "left" | "right"
    onClick: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex h-full cursor-pointer select-none items-center justify-center bg-muted/50 transition-colors hover:bg-muted",
                side === "left" ? "border-r" : "border-l"
            )}
            role="button"
            aria-label={`Expand ${label}`}
        >
            <span className="rotate-180 text-xs font-medium uppercase tracking-widest text-muted-foreground [writing-mode:vertical-lr]">
                {label}
            </span>
        </div>
    )
}

// ── separator ─────────────────────────────────────────────────────────────────

function PanelSeparator() {
    return (
        <Separator className="w-[3px] cursor-col-resize bg-border transition-colors hover:bg-primary/30 data-[resize-handle-active]:bg-primary/50" />
    )
}

// ── layout ────────────────────────────────────────────────────────────────────

interface AdminRoomLayoutProps {
    roomId: string
}

export function AdminRoomLayout({ roomId }: AdminRoomLayoutProps) {
    const [replyTo, setReplyTo] = useState<MessageWithUser | null>(null)
    const [mode, setMode] = useState<LayoutMode>("default")
    const [leftCollapsed, setLeftCollapsed] = useState(false)
    const [rightCollapsed, setRightCollapsed] = useState(false)

    const groupRef = useGroupRef()
    const leftPanelRef = usePanelRef()
    const rightPanelRef = usePanelRef()

    function applyMode(newMode: LayoutMode) {
        setMode(newMode)
        groupRef.current?.setLayout(SIZES[newMode])
    }

    function handleManagementFullscreen() {
        if (mode === "left-full") applyMode("default")
        else if (mode === "right-full") applyMode("both-expanded")
        else if (mode === "both-expanded") applyMode("right-full")
        else applyMode("left-full")
    }

    function handleAnalyticsFullscreen() {
        if (mode === "right-full") applyMode("default")
        else if (mode === "left-full") applyMode("both-expanded")
        else if (mode === "both-expanded") applyMode("left-full")
        else applyMode("right-full")
    }

    function handleLeftTabClick() {
        applyMode(mode === "right-full" ? "both-expanded" : "default")
    }

    function handleRightTabClick() {
        applyMode(mode === "left-full" ? "both-expanded" : "default")
    }

    return (
        // Fixed overlay: covers full viewport, breaking out of the 480px user guard
        <div className="fixed inset-0 z-40 flex bg-background">
            <Group orientation="horizontal" groupRef={groupRef} className="flex-1">
                {/* ── Left: Management ── */}
                <Panel
                    id="management"
                    panelRef={leftPanelRef}
                    collapsible
                    collapsedSize={5}
                    minSize={20}
                    defaultSize={25}
                    onResize={(size) => setLeftCollapsed(size.asPercentage <= COLLAPSED_THRESHOLD)}
                >
                    {leftCollapsed ? (
                        <VerticalTab label="Management" side="left" onClick={handleLeftTabClick} />
                    ) : (
                        <RoomManagementPanel
                            roomId={roomId}
                            onFullscreen={handleManagementFullscreen}
                            isFullscreen={mode === "left-full"}
                        />
                    )}
                </Panel>

                <PanelSeparator />

                {/* ── Center: Chat ── */}
                <Panel id="chat" defaultSize={50}>
                    <div className="flex h-full flex-col overflow-hidden">
                        <RoomHeader roomId={roomId} />
                        <ChatFeed roomId={roomId} onReply={setReplyTo} />
                        <SendMessage
                            roomId={roomId}
                            replyTo={replyTo}
                            onClearReply={() => setReplyTo(null)}
                        />
                    </div>
                </Panel>

                <PanelSeparator />

                {/* ── Right: Analytics ── */}
                <Panel
                    id="analytics"
                    panelRef={rightPanelRef}
                    collapsible
                    collapsedSize={5}
                    minSize={20}
                    defaultSize={25}
                    onResize={(size) => setRightCollapsed(size.asPercentage <= COLLAPSED_THRESHOLD)}
                >
                    {rightCollapsed ? (
                        <VerticalTab label="Analytics" side="right" onClick={handleRightTabClick} />
                    ) : (
                        <AnalyticsDashboard
                            roomId={roomId}
                            onFullscreen={handleAnalyticsFullscreen}
                            isFullscreen={mode === "right-full"}
                        />
                    )}
                </Panel>
            </Group>
        </div>
    )
}

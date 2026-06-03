import { useCallback, useState } from "react"
import { Group, Panel, Separator, useGroupRef } from "react-resizable-panels"
import { ChatFeed } from "@/widgets/chat-feed"
import { RoomManagementPanel } from "@/widgets/room-management"
import { AnalyticsDashboard } from "@/widgets/analytics-dashboard"
import { RoomHeader } from "@/widgets/room-header"
import { SendMessage } from "@/features/chat"
import type { MessageWithUser } from "@/entities/message"
import { cn } from "@/shared/lib/cn"

// ── types & constants ──────────────────────────────────────────────────────────

type LayoutState =
    | "default"
    | "manage-tab"
    | "analytics-tab"
    | "both-tabs"
    | "manage-expanded"
    | "analytics-expanded"

// Sizes (%) per logical state — must sum to 100
const SIZES: Record<LayoutState, { manage: number; chat: number; analytics: number }> = {
    "default":            { manage: 33, chat: 34, analytics: 33     },
    "manage-tab":         { manage: 3,  chat: 48.5, analytics: 48.5 },
    "analytics-tab":      { manage: 48.5, chat: 48.5, analytics: 3  },
    "both-tabs":          { manage: 3,  chat: 94, analytics: 3      },
    "manage-expanded":    { manage: 94, chat: 3,  analytics: 3      },
    "analytics-expanded": { manage: 3,  chat: 3,  analytics: 94     },
}

const TAB_THRESHOLD = 5

function deriveState(sizes: { [id: string]: number }): LayoutState {
    const m = sizes["manage"]    ?? 33
    const c = sizes["chat"]      ?? 34
    const a = sizes["analytics"] ?? 33
    const mTab = m <= TAB_THRESHOLD
    const cTab = c <= TAB_THRESHOLD
    const aTab = a <= TAB_THRESHOLD
    if (!mTab && !cTab && !aTab) return "default"
    if ( mTab && !cTab && !aTab) return "manage-tab"
    if (!mTab && !cTab &&  aTab) return "analytics-tab"
    if ( mTab && !cTab &&  aTab) return "both-tabs"
    if (!mTab &&  cTab &&  aTab) return "manage-expanded"
    if ( mTab &&  cTab && !aTab) return "analytics-expanded"
    return "default"
}

// ── vertical tab strip ─────────────────────────────────────────────────────────

function VerticalTab({
    label,
    border,
    onClick,
}: {
    label: string
    border: "left" | "right" | "both"
    onClick: () => void
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => e.key === "Enter" && onClick()}
            aria-label={`Expand ${label}`}
            className={cn(
                "flex h-full cursor-pointer select-none items-center justify-center bg-muted/40 transition-colors hover:bg-muted",
                border === "left"  && "border-r",
                border === "right" && "border-l",
                border === "both"  && "border-x",
            )}
        >
            <span className="rotate-180 text-xs font-medium uppercase tracking-widest text-muted-foreground [writing-mode:vertical-lr]">
                {label}
            </span>
        </div>
    )
}

// ── resize separator ───────────────────────────────────────────────────────────

function PanelSeparator({ disabled }: { disabled?: boolean }) {
    return (
        <Separator
            disabled={disabled}
            className={cn(
                "w-[3px] bg-border transition-colors",
                !disabled && "cursor-col-resize hover:bg-primary/30 data-[resize-handle-active]:bg-primary/50",
            )}
        />
    )
}

// ── layout ────────────────────────────────────────────────────────────────────

interface AdminRoomLayoutProps {
    roomId: string
}

export function AdminRoomLayout({ roomId }: AdminRoomLayoutProps) {
    const [replyTo, setReplyTo] = useState<MessageWithUser | null>(null)
    const [sizes, setSizes] = useState<{ [id: string]: number }>({
        manage: 33, chat: 34, analytics: 33,
    })

    const groupRef = useGroupRef()

    const handleLayoutChanged = useCallback((layout: { [id: string]: number }) => {
        setSizes(layout)
    }, [])

    // ── derived state ──────────────────────────────────────────────────────────

    const manageIsTab    = (sizes["manage"]    ?? 33) <= TAB_THRESHOLD
    const chatIsTab      = (sizes["chat"]      ?? 34) <= TAB_THRESHOLD
    const analyticsIsTab = (sizes["analytics"] ?? 33) <= TAB_THRESHOLD

    const layoutState         = deriveState(sizes)
    const manageIsExpanded    = layoutState === "manage-expanded"
    const analyticsIsExpanded = layoutState === "analytics-expanded"
    const isAnyExpanded       = chatIsTab // chat is a tab strip only when a side panel is fully expanded

    // ── transitions ────────────────────────────────────────────────────────────

    function applyLayout(state: LayoutState) {
        groupRef.current?.setLayout(SIZES[state])
    }

    // Collapse: if the other side panel is already a tab → go to both-tabs
    function handleManageCollapse()    { applyLayout(analyticsIsTab ? "both-tabs" : "manage-tab") }
    function handleAnalyticsCollapse() { applyLayout(manageIsTab    ? "both-tabs" : "analytics-tab") }

    // Expand: toggle full-width on/off
    function handleManageExpandToggle()    { applyLayout(manageIsExpanded    ? "default" : "manage-expanded") }
    function handleAnalyticsExpandToggle() { applyLayout(analyticsIsExpanded ? "default" : "analytics-expanded") }

    // Tab strip clicks
    function handleManageTabClick() {
        // In both-tabs: restore manage, keep analytics as tab
        // In analytics-expanded: clicking manage tab → clicking the non-expanded tab would
        // leave chat as the only remaining tab, so go to default instead
        applyLayout(layoutState === "both-tabs" ? "analytics-tab" : "default")
    }
    function handleAnalyticsTabClick() {
        applyLayout(layoutState === "both-tabs" ? "manage-tab" : "default")
    }
    // Chat tab only exists in expanded states
    function handleChatTabClick() {
        if (manageIsExpanded)         applyLayout("analytics-tab")
        else if (analyticsIsExpanded) applyLayout("manage-tab")
    }

    // ── render ─────────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-40 flex bg-background">
            <Group
                orientation="horizontal"
                groupRef={groupRef}
                onLayoutChanged={handleLayoutChanged}
                className="flex-1"
            >
                {/* ── Left: Management ── */}
                <Panel id="manage" defaultSize={33} minSize={3}>
                    {manageIsTab ? (
                        <VerticalTab label="Management" border="left" onClick={handleManageTabClick} />
                    ) : (
                        <RoomManagementPanel
                            roomId={roomId}
                            onCollapse={handleManageCollapse}
                            onExpandToggle={handleManageExpandToggle}
                            isExpanded={manageIsExpanded}
                        />
                    )}
                </Panel>

                <PanelSeparator disabled={isAnyExpanded} />

                {/* ── Center: Chat ── */}
                <Panel id="chat" defaultSize={34} minSize={3}>
                    {chatIsTab ? (
                        <VerticalTab label="Chat" border="both" onClick={handleChatTabClick} />
                    ) : (
                        <div className="flex h-full flex-col overflow-hidden">
                            <RoomHeader roomId={roomId} />
                            <ChatFeed roomId={roomId} onReply={setReplyTo} />
                            <SendMessage
                                roomId={roomId}
                                replyTo={replyTo}
                                onClearReply={() => setReplyTo(null)}
                                isAdmin
                            />
                        </div>
                    )}
                </Panel>

                <PanelSeparator disabled={isAnyExpanded} />

                {/* ── Right: Analytics ── */}
                <Panel id="analytics" defaultSize={33} minSize={3}>
                    {analyticsIsTab ? (
                        <VerticalTab label="Analytics" border="right" onClick={handleAnalyticsTabClick} />
                    ) : (
                        <AnalyticsDashboard
                            roomId={roomId}
                            onCollapse={handleAnalyticsCollapse}
                            onExpandToggle={handleAnalyticsExpandToggle}
                            isExpanded={analyticsIsExpanded}
                        />
                    )}
                </Panel>
            </Group>
        </div>
    )
}

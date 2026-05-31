import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    ArrowExpand01Icon,
    ArrowShrink01Icon,
    ArrowLeft01Icon,
    Delete02Icon,
    UserStar01Icon,
    User03Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { useRoomMembers } from "@/entities/room"
import type { RoomMemberWithUser } from "@/entities/room"
import { useUpdateMember, useRemoveMember } from "@/entities/room-member"
import { useUserStore } from "@/entities/user"
import { EditRoomForm } from "@/features/room-management"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/cn"

// ── helpers ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#e17055", "#6c5ce7", "#00b894", "#0984e3", "#fd79a8", "#e67e22", "#8e44ad"]
function avatarColor(id: string) {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ── member row ─────────────────────────────────────────────────────────────────

interface MemberRowProps {
    member: RoomMemberWithUser
    roomId: string
    currentUserId: string
}

function MemberRow({ member, roomId, currentUserId }: MemberRowProps) {
    const { mutate: updateMember, isPending: updating } = useUpdateMember(roomId)
    const { mutate: removeMember, isPending: removing } = useRemoveMember(roomId)
    const isSelf = member.user_id === currentUserId
    const isAdmin = member.role === "admin"
    const name = member.user?.name ?? "Unknown"

    function toggleRole() {
        updateMember(
            { userId: member.user_id, role: isAdmin ? "user" : "admin" },
            { onError: () => toast.error("Failed to update role") },
        )
    }

    function kick() {
        removeMember(member.user_id, { onError: () => toast.error("Failed to remove member") })
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2">
            <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: avatarColor(member.user_id) }}
            >
                {member.user?.avatar_url ? (
                    <img
                        src={member.user.avatar_url}
                        alt={name}
                        className="h-8 w-8 rounded-full object-cover"
                    />
                ) : (
                    name.charAt(0).toUpperCase()
                )}
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                    {name}
                    {isSelf && <span className="text-muted-foreground ml-1 text-xs">(you)</span>}
                </p>
                {member.user?.username && (
                    <p className="truncate text-xs text-muted-foreground">@{member.user.username}</p>
                )}
            </div>

            <Badge
                variant="secondary"
                className={cn(
                    "shrink-0 text-[10px]",
                    isAdmin && "bg-amber-500/15 text-amber-600",
                )}
            >
                {isAdmin ? "admin" : "user"}
            </Badge>

            {!isSelf && (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={toggleRole}
                        disabled={updating || removing}
                        aria-label={isAdmin ? "Demote to user" : "Promote to admin"}
                        title={isAdmin ? "Demote to user" : "Promote to admin"}
                    >
                        <HugeiconsIcon
                            icon={isAdmin ? User03Icon : UserStar01Icon}
                            size={14}
                            className="text-muted-foreground"
                        />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={kick}
                        disabled={updating || removing}
                        aria-label="Remove member"
                        title="Remove member"
                    >
                        <HugeiconsIcon icon={Delete02Icon} size={14} className="text-destructive" />
                    </Button>
                </div>
            )}
        </div>
    )
}

// ── panel ─────────────────────────────────────────────────────────────────────

interface RoomManagementPanelProps {
    roomId: string
    onCollapse?: () => void
    onExpandToggle?: () => void
    isExpanded?: boolean
}

export function RoomManagementPanel({
    roomId,
    onCollapse,
    onExpandToggle,
    isExpanded = false,
}: RoomManagementPanelProps) {
    const currentUser = useUserStore((s) => s.user)
    const [section, setSection] = useState<"room" | "members">("room")
    const { data: members = [], isLoading: membersLoading } = useRoomMembers(roomId)

    return (
        <div className="flex h-full flex-col overflow-hidden border-r bg-background">
            {/* Header */}
            <div className="flex items-center gap-2 border-b px-3 py-2 shrink-0">
                <h2 className="flex-1 text-sm font-semibold">Management</h2>
                {onCollapse && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onCollapse}
                        aria-label="Collapse panel"
                        title="Collapse panel"
                    >
                        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
                    </Button>
                )}
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
            </div>

            {/* Section tabs */}
            <div className="flex border-b shrink-0">
                {(["room", "members"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSection(tab)}
                        className={cn(
                            "flex-1 py-2 text-xs font-medium capitalize transition-colors",
                            section === tab
                                ? "border-b-2 border-primary text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {tab === "members" ? `Members (${members.length})` : "Room Info"}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {section === "room" && <EditRoomForm roomId={roomId} />}

                {section === "members" && (
                    <div className="divide-y">
                        {membersLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : members.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-muted-foreground">No members</p>
                        ) : (
                            members.map((m) => (
                                <MemberRow
                                    key={m.user_id}
                                    member={m}
                                    roomId={roomId}
                                    currentUserId={currentUser?.id ?? ""}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

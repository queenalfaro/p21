import { useNavigate, useParams } from "react-router"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    ArrowLeft01Icon,
    Share01Icon,
    UserAdd01Icon,
    Calendar01Icon,
    Time01Icon,
} from "@hugeicons/core-free-icons"
import { useGetRoom, useGetMembership, useRoomMembers } from "@/entities/room"
import type { RoomMemberWithUser } from "@/entities/room"
import { useUserStore } from "@/entities/user"
import { RoomManagementPanel } from "@/widgets/room-management"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/lib/cn"

// ── helpers ────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
    active: { label: "Active", className: "bg-green-500/15 text-green-600" },
    completed: { label: "Completed", className: "bg-muted text-muted-foreground" },
}

const AVATAR_COLORS = ["#e17055", "#6c5ce7", "#00b894", "#0984e3", "#fd79a8", "#e67e22", "#8e44ad"]
function avatarColor(id: string) {
    let hash = 0
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function MemberRow({ member }: { member: RoomMemberWithUser }) {
    const { user, role } = member
    const name = user?.name ?? "Unknown"
    const letter = name.charAt(0).toUpperCase()

    return (
        <div className="flex items-center gap-3 px-4 py-2.5">
            {user?.avatar_url ? (
                <img
                    src={user.avatar_url}
                    alt={name}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
            ) : (
                <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: avatarColor(user?.id ?? name) }}
                >
                    {letter}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                {user?.username && (
                    <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                )}
            </div>
            {role === "admin" && (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                    admin
                </Badge>
            )}
        </div>
    )
}

// ── page ───────────────────────────────────────────────────────────────────────

export function RoomSettingsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const user = useUserStore((s) => s.user)

    const { data: room, isLoading: roomLoading } = useGetRoom(id)
    const { data: membership } = useGetMembership(id, user?.id)
    const { data: members = [], isLoading: membersLoading } = useRoomMembers(id!)

    const isCompleted = room?.status === "completed"
    const statusMeta = STATUS_LABELS[room?.status ?? "draft"] ?? STATUS_LABELS.draft

    function formatDate(iso: string | null) {
        if (!iso) return null
        return format(new Date(iso), "MMM d, yyyy · HH:mm")
    }

    return (
        <div className="flex min-h-dvh flex-col">
            {/* Header */}
            <header className="bg-background sticky top-0 z-10 flex items-center gap-2 border-b px-2 py-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </Button>
                <h1 className="flex-1 text-base font-semibold">Room Info</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/room/${id}/share`)}
                    aria-label="Invite people"
                >
                    <HugeiconsIcon icon={Share01Icon} size={20} />
                </Button>
            </header>

            {roomLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : room ? (
                <main className="flex-1 overflow-y-auto pb-safe">
                    {/* Room identity */}
                    <div className={cn("flex flex-col items-center gap-3 px-6 py-8 text-center", isCompleted && "opacity-70")}>
                        <div
                            className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                            style={{ backgroundColor: avatarColor(room.id) }}
                        >
                            {room.avatar_url ? (
                                <img
                                    src={room.avatar_url}
                                    alt={room.name}
                                    className="h-20 w-20 rounded-full object-cover"
                                />
                            ) : (
                                room.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{room.name}</h2>
                            <p className="text-sm text-muted-foreground">@{room.roomname}</p>
                        </div>
                        {room.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                                {room.description}
                            </p>
                        )}
                    </div>

                    {/* Meta info */}
                    <div className="mx-4 mb-4 rounded-xl border bg-muted/30">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <span className="text-xs text-muted-foreground w-16 shrink-0">Status</span>
                            <Badge className={cn("text-xs font-medium", statusMeta.className)}>
                                {statusMeta.label}
                            </Badge>
                        </div>
                        {room.starts_at && (
                            <div className="flex items-center gap-3 border-t px-4 py-3">
                                <HugeiconsIcon
                                    icon={Calendar01Icon}
                                    size={16}
                                    className="shrink-0 text-muted-foreground"
                                />
                                <span className="text-sm">{formatDate(room.starts_at)}</span>
                            </div>
                        )}
                        {room.ends_at && (
                            <div className="flex items-center gap-3 border-t px-4 py-3">
                                <HugeiconsIcon
                                    icon={Time01Icon}
                                    size={16}
                                    className="shrink-0 text-muted-foreground"
                                />
                                <span className="text-sm text-muted-foreground">
                                    Ends {formatDate(room.ends_at)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Invite */}
                    <div className="px-4 mb-4">
                        <Button
                            className="w-full gap-2"
                            variant="outline"
                            onClick={() => navigate(`/room/${id}/share`)}
                        >
                            <HugeiconsIcon icon={UserAdd01Icon} size={18} />
                            Invite People
                        </Button>
                    </div>

                    {/* Members */}
                    <div className="mb-4">
                        <div className="flex items-baseline gap-2 px-4 pb-1 pt-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Members
                            </h3>
                            {members.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {members.length}
                                </span>
                            )}
                        </div>
                        <div className="divide-y">
                            {membersLoading ? (
                                <div className="flex justify-center py-6">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                            ) : members.length === 0 ? (
                                <p className="px-4 py-4 text-sm text-muted-foreground">
                                    No members yet
                                </p>
                            ) : (
                                members.map((m) => (
                                    <MemberRow key={m.user_id} member={m} />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Admin zone — visible to admins on mobile (desktop uses splitscreen) */}
                    {membership?.role === "admin" && (
                        <div className="mb-6">
                            <div className="flex items-baseline gap-2 px-4 pb-1 pt-2">
                                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Admin Zone
                                </h3>
                            </div>
                            <div className="mx-4 overflow-hidden rounded-xl border" style={{ height: 480 }}>
                                <RoomManagementPanel roomId={id!} />
                            </div>
                        </div>
                    )}
                </main>
            ) : (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm text-destructive">Room not found</p>
                </div>
            )}
        </div>
    )
}

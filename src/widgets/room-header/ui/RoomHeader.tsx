import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Analytics01Icon } from "@hugeicons/core-free-icons"
import { useGetRoom, useRoomMemberCount } from "@/entities/room"
import { Button } from "@/shared/ui/button"

interface RoomHeaderProps {
    roomId: string
    /** When true, shows admin-specific controls (mobile only; desktop uses splitscreen) */
    isAdmin?: boolean
}

export function RoomHeader({ roomId, isAdmin = false }: RoomHeaderProps) {
    const navigate = useNavigate()
    const { data: room } = useGetRoom(roomId)
    const { data: memberCount } = useRoomMemberCount(roomId)

    const avatarLetter = room?.name.charAt(0).toUpperCase() ?? "…"

    return (
        <header className="bg-background sticky top-0 z-10 flex items-center gap-2 border-b px-2 py-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                aria-label="Back to home"
            >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
            </Button>

            {/* Clickable center area → room settings */}
            <button
                type="button"
                className="flex flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-accent/50 active:bg-accent"
                onClick={() => navigate(`/room/${roomId}/settings`)}
            >
                <div className="bg-primary text-primary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {room?.avatar_url ? (
                        <img
                            src={room.avatar_url}
                            alt={room.name}
                            className="h-9 w-9 rounded-full object-cover"
                        />
                    ) : (
                        avatarLetter
                    )}
                </div>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight">
                        {room?.name ?? "…"}
                    </p>
                    {memberCount !== undefined && (
                        <p className="text-muted-foreground text-xs leading-tight">
                            {memberCount} member{memberCount !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>
            </button>

            {/* Admin-only: analytics shortcut (mobile; desktop uses splitscreen) */}
            {isAdmin && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/room/${roomId}/analytics`)}
                    aria-label="Analytics"
                >
                    <HugeiconsIcon icon={Analytics01Icon} size={20} />
                </Button>
            )}
        </header>
    )
}

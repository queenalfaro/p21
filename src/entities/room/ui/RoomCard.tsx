import { format, isToday } from "date-fns"
import type { Room } from "../model/types"

function RoomAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("")

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={name}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
        )
    }
    return (
        <div className="bg-primary text-primary-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
            {initials}
        </div>
    )
}

function StatusDot({ status }: { status: Room["status"] }) {
    if (status === "active") {
        return (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                Live
            </span>
        )
    }
    if (status === "completed") {
        return <span className="text-muted-foreground text-xs">Ended</span>
    }
    return <span className="text-muted-foreground text-xs">Draft</span>
}

function formatRoomDate(dateStr: string | null): string {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    return isToday(date) ? format(date, "HH:mm") : format(date, "d MMM")
}

interface RoomCardProps {
    room: Room
    onClick: () => void
}

export function RoomCard({ room, onClick }: RoomCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 active:bg-accent"
        >
            <RoomAvatar name={room.name} avatarUrl={room.avatar_url} />

            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{room.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                        {formatRoomDate(room.starts_at ?? room.created_at)}
                    </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                    <StatusDot status={room.status} />
                    {room.roomname && (
                        <span className="text-muted-foreground truncate text-xs">
                            @{room.roomname}
                        </span>
                    )}
                </div>
            </div>
        </button>
    )
}

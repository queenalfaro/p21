import { useState } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
    QrCode01Icon,
    Add01Icon,
    Search01Icon,
    Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { useUserStore } from "@/entities/user"
import { useMyRooms, useSearchRooms, RoomCard } from "@/entities/room"
import { getCurrentUserId } from "@/shared/lib/identity"
import { useDebounce } from "@/shared/lib/use-debounce"
import { Input } from "@/shared/ui/input"
import { Button } from "@/shared/ui/button"

function UserAvatarButton({ onClick }: { onClick: () => void }) {
    const user = useUserStore((s) => s.user)
    const name = user?.name ?? "?"
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("")

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-80"
        >
            {user?.avatar_url ? (
                <img
                    src={user.avatar_url}
                    alt={name}
                    className="h-9 w-9 rounded-full object-cover"
                />
            ) : (
                initials
            )}
        </button>
    )
}

function RoomListContent({
    query,
    userId,
    onRoomClick,
}: {
    query: string
    userId: string
    onRoomClick: (room: import("@/entities/room").Room) => void
}) {
    const myRooms = useMyRooms(userId)
    const searchRooms = useSearchRooms(query)
    const isSearching = query.length > 0

    const { data, isLoading, error } = isSearching ? searchRooms : myRooms

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center py-16">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-destructive text-sm">Failed to load rooms</p>
                <p className="text-muted-foreground text-xs">
                    {error instanceof Error ? error.message : "Unknown error"}
                </p>
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
                <p className="text-muted-foreground text-sm">
                    {isSearching ? "No rooms found" : "No rooms yet"}
                </p>
                {!isSearching && (
                    <p className="text-muted-foreground text-xs">
                        Create or join a room to get started
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className="divide-y">
            {data.map((room) => (
                <RoomCard key={room.id} room={room} onClick={() => onRoomClick(room)} />
            ))}
        </div>
    )
}

export function HomePage() {
    const navigate = useNavigate()
    const userId = getCurrentUserId()
    const [query, setQuery] = useState("")
    const debouncedQuery = useDebounce(query, 300)

    return (
        <div className="flex min-h-svh flex-col">
            {/* Header */}
            <header className="bg-background sticky top-0 z-10 border-b">
                <div className="flex items-center gap-3 px-4 py-3">
                    <UserAvatarButton onClick={() => navigate("/profile")} />
                    <h1 className="flex-1 text-base font-semibold">Event</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/scan")}
                        aria-label="Scan QR"
                    >
                        <HugeiconsIcon icon={QrCode01Icon} size={20} />
                    </Button>
                </div>

                {/* Search */}
                <div className="px-4 pb-3">
                    <div className="relative">
                        <HugeiconsIcon
                            icon={Search01Icon}
                            size={16}
                            className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
                        />
                        <Input
                            className="pl-9 pr-9"
                            placeholder="Search rooms…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2"
                                aria-label="Clear search"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Room list */}
            <main className="flex flex-1 flex-col">
                <RoomListContent
                    query={debouncedQuery}
                    userId={userId}
                    onRoomClick={(room) => {
                        if (debouncedQuery) {
                            navigate(`/join/${room.roomname}`)
                        } else {
                            navigate(`/room/${room.id}`)
                        }
                    }}
                />
            </main>

            {/* FAB — Create room */}
            <Button
                size="icon"
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
                onClick={() => navigate("/create-room")}
                aria-label="Create room"
            >
                <HugeiconsIcon icon={Add01Icon} size={24} />
            </Button>
        </div>
    )
}

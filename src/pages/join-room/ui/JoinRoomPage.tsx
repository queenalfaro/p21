import { useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { useGetRoomByRoomname, useGetMembership, useJoinRoom } from "@/entities/room"
import { useUserStore } from "@/entities/user"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { format } from "date-fns"

const STATUS_LABEL: Record<string, string> = {
    draft: "Draft",
    active: "Live",
    completed: "Ended",
}

export function JoinRoomPage() {
    const { roomname } = useParams<{ roomname: string }>()
    const navigate = useNavigate()
    const user = useUserStore((s) => s.user)
    const userId = user?.id ?? ""

    const { data: room, isLoading: roomLoading, error: roomError } = useGetRoomByRoomname(roomname)
    const { data: membership, isLoading: membershipLoading } = useGetMembership(room?.id, userId)
    const joinRoom = useJoinRoom(userId)

    // If user is already a member, redirect to the room
    useEffect(() => {
        if (membership && room) {
            navigate(`/room/${room.id}`, { replace: true })
        }
    }, [membership, room, navigate])

    async function handleJoin() {
        if (!room) return
        await joinRoom.mutateAsync(room.id)
        navigate(`/room/${room.id}`, { replace: true })
    }

    const isLoading = roomLoading || membershipLoading

    return (
        <div className="flex min-h-svh flex-col">
            <header className="bg-background sticky top-0 z-10 flex items-center gap-3 border-b px-2 py-2">
                <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
                            if (idx > 0) navigate(-1)
                            else navigate("/", { replace: true })
                        }}
                        aria-label="Back"
                    >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </Button>
                <h1 className="text-base font-semibold">Join Room</h1>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
                {isLoading && (
                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                )}

                {roomError && (
                    <div className="text-center">
                        <p className="text-destructive font-medium">Failed to load room</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {roomError instanceof Error ? roomError.message : "Unknown error"}
                        </p>
                    </div>
                )}

                {!isLoading && !roomError && !room && (
                    <div className="text-center">
                        <p className="font-medium">Room not found</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            No room with handle @{roomname}
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => navigate("/", { replace: true })}>
                            Go Home
                        </Button>
                    </div>
                )}

                {!isLoading && room && !membership && (
                    <div className="flex w-full max-w-sm flex-col items-center gap-4">
                        {/* Room avatar */}
                        <div className="bg-primary text-primary-foreground flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold">
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

                        <div className="text-center">
                            <h2 className="text-xl font-semibold">{room.name}</h2>
                            <p className="text-muted-foreground text-sm">@{room.roomname}</p>
                        </div>

                        <Badge
                            variant={room.status === "active" ? "default" : "secondary"}
                        >
                            {STATUS_LABEL[room.status ?? "draft"] ?? room.status}
                        </Badge>

                        {room.description && (
                            <p className="text-muted-foreground text-center text-sm">
                                {room.description}
                            </p>
                        )}

                        {room.starts_at && (
                            <p className="text-muted-foreground text-sm">
                                {format(new Date(room.starts_at), "d MMM yyyy, HH:mm")}
                            </p>
                        )}

                        {joinRoom.error && (
                            <p className="text-destructive text-sm">
                                {joinRoom.error instanceof Error
                                    ? joinRoom.error.message
                                    : "Failed to join"}
                            </p>
                        )}

                        <Button
                            className="mt-2 w-full"
                            onClick={handleJoin}
                            disabled={joinRoom.isPending}
                        >
                            {joinRoom.isPending ? "Joining…" : "Join Room"}
                        </Button>
                    </div>
                )}
            </main>
        </div>
    )
}

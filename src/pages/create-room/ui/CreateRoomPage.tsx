import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { CreateRoomForm } from "@/features/room-management"
import { Button } from "@/shared/ui/button"
import type { Room } from "@/entities/room"

export function CreateRoomPage() {
    const navigate = useNavigate()

    function handleSuccess(room: Room) {
        navigate(`/room/${room.id}/share`, { replace: true })
    }

    return (
        <div className="flex min-h-svh flex-col">
            <header className="bg-background sticky top-0 z-10 flex items-center gap-3 border-b px-2 py-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </Button>
                <h1 className="text-base font-semibold">New Room</h1>
            </header>

            <CreateRoomForm onSuccess={handleSuccess} />
        </div>
    )
}

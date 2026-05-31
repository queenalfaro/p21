import { useNavigate, useParams } from "react-router"
import { QRCodeSVG } from "qrcode.react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, Copy01Icon, Share01Icon } from "@hugeicons/core-free-icons"
import { useGetRoom } from "@/entities/room"
import { Button } from "@/shared/ui/button"
import { toast } from "sonner"

export function SharePage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { data: room, isLoading } = useGetRoom(id)

    const joinUrl = room ? `${window.location.origin}/join/${room.roomname}` : ""

    async function copyLink() {
        await navigator.clipboard.writeText(joinUrl)
        toast.success("Link copied!")
    }

    async function shareNative() {
        if (!navigator.share) {
            await copyLink()
            return
        }
        await navigator.share({ title: room?.name, url: joinUrl })
    }

    return (
        <div className="flex min-h-svh flex-col">
            <header className="bg-background sticky top-0 z-10 flex items-center gap-3 border-b px-2 py-2">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </Button>
                <h1 className="text-base font-semibold">Invite to Room</h1>
            </header>

            <main className="flex flex-1 flex-col items-center gap-8 px-6 py-10">
                {isLoading && (
                    <div className="border-primary mt-20 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                )}

                {room && (
                    <>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h2 className="text-lg font-semibold">{room.name}</h2>
                            <p className="text-muted-foreground text-sm">@{room.roomname}</p>
                        </div>

                        {/* QR code */}
                        <div className="rounded-2xl border bg-white p-4 shadow-sm">
                            <QRCodeSVG value={joinUrl} size={200} level="M" />
                        </div>

                        {/* Invite link */}
                        <div className="bg-muted w-full max-w-sm rounded-xl px-4 py-3 text-center">
                            <p className="text-muted-foreground break-all text-sm">{joinUrl}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex w-full max-w-sm flex-col gap-3">
                            <Button onClick={copyLink} variant="outline" className="gap-2">
                                <HugeiconsIcon icon={Copy01Icon} size={18} />
                                Copy Link
                            </Button>
                            <Button onClick={shareNative} className="gap-2">
                                <HugeiconsIcon icon={Share01Icon} size={18} />
                                Share
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={() => navigate(`/room/${room.id}`, { replace: true })}
                        >
                            Enter Room →
                        </Button>
                    </>
                )}
            </main>
        </div>
    )
}

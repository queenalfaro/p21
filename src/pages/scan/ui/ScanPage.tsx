import { useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { useQRScanner } from "@/shared/lib/use-qr-scanner"
import { Button } from "@/shared/ui/button"

export function ScanPage() {
    const navigate = useNavigate()

    const handleScan = useCallback(
        (data: string) => {
            try {
                const url = new URL(data)
                // Navigate only within our app
                if (url.origin === window.location.origin) {
                    navigate(url.pathname + url.search)
                } else {
                    // Treat raw data as a roomname fallback
                    navigate(`/join/${encodeURIComponent(data)}`)
                }
            } catch {
                // Not a URL — treat as roomname
                navigate(`/join/${encodeURIComponent(data)}`)
            }
        },
        [navigate],
    )

    const { videoRef, error, isReady } = useQRScanner(handleScan)

    return (
        <div className="relative flex min-h-svh flex-col bg-black">
            {/* Back button */}
            <div className="absolute left-2 top-2 z-20">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                    className="text-white hover:bg-white/20 hover:text-white"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </Button>
            </div>

            {/* Camera feed — captions not applicable for a live camera viewfinder */}
            <video
                ref={videoRef}
                aria-label="Camera viewfinder"
                className="absolute inset-0 h-full w-full object-cover"
                playsInline
                muted
            />

            {/* Dark overlay with scan-frame cutout */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                <div
                    className="h-56 w-56 rounded-2xl"
                    style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }}
                />
                {/* Corner marks */}
                <div className="pointer-events-none absolute h-56 w-56 rounded-2xl border-4 border-white/80" />
            </div>

            {/* Status text */}
            <div className="absolute bottom-16 left-0 right-0 z-20 flex flex-col items-center gap-3 px-6 text-center">
                {error ? (
                    <p className="rounded-lg bg-black/60 px-4 py-2 text-sm text-red-400">{error}</p>
                ) : !isReady ? (
                    <p className="text-sm text-white/70">Requesting camera…</p>
                ) : (
                    <p className="text-sm text-white/70">Point at a QR code to join a room</p>
                )}
            </div>
        </div>
    )
}

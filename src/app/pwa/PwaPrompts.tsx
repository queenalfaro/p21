import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { usePwaLifecycle } from "./use-pwa-lifecycle"

export function PwaPrompts() {
    const { isInstallable, installPrompt, dismissInstall, needsUpdate, applyUpdate } =
        usePwaLifecycle()

    return (
        <>
            {/* ── Install dialog ───────────────────────────────────────────── */}
            <Dialog open={isInstallable} onOpenChange={(open) => !open && dismissInstall()}>
                <DialogContent className="max-w-xs">
                    <button
                        onClick={dismissInstall}
                        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                        aria-label="Close"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} size={18} />
                    </button>

                    {/* App icon */}
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                            EA
                        </div>
                        <div>
                            <DialogTitle>Event App</DialogTitle>
                            <p className="text-xs text-muted-foreground">Install app</p>
                        </div>
                    </div>

                    <DialogDescription className="mb-5 space-y-1.5 text-sm leading-relaxed">
                        <span className="block">📶 Works offline</span>
                        <span className="block">⚡ Fast launch from your home screen</span>
                        <span className="block">🔕 No browser address bar</span>
                    </DialogDescription>

                    <div className="flex flex-col gap-2">
                        <Button className="w-full" onClick={installPrompt}>
                            Install
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={dismissInstall}>
                            Later
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Update toast ─────────────────────────────────────────────── */}
            {needsUpdate && (
                <div
                    role="alert"
                    className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border bg-background px-4 py-2.5 shadow-lg"
                >
                    <span className="text-sm">Update available</span>
                    <Button size="sm" className="h-7 text-xs" onClick={applyUpdate}>
                        Reload
                    </Button>
                </div>
            )}
        </>
    )
}

import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { usePwaLifecycle } from "./use-pwa-lifecycle"

export function PwaPrompts() {
    const {
        isInstallable,
        installPending,
        installAccepted,
        installPrompt,
        dismissInstall,
        acknowledgeInstall,
        needsUpdate,
        applyUpdate,
        dismissUpdate,
    } = usePwaLifecycle()

    const installDialogOpen = isInstallable || installPending || installAccepted

    return (
        <>
            {/* ── Install dialog ───────────────────────────────────────────── */}
            <Dialog
                open={installDialogOpen}
                onOpenChange={(open) => !open && (installAccepted ? acknowledgeInstall() : dismissInstall())}
            >
                <DialogContent
                    className="max-w-xs"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {installAccepted ? (
                        /* State 3: installed successfully */
                        <>
                            <div className="mb-4 flex flex-col items-center gap-3 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                                    EA
                                </div>
                                <DialogTitle>App Installed!</DialogTitle>
                            </div>
                            <DialogDescription className="mb-5 text-center text-sm leading-relaxed">
                                Event App has been added to your home screen. Open it from there for the best experience.
                            </DialogDescription>
                            <Button className="w-full" onClick={acknowledgeInstall}>
                                Got it
                            </Button>
                        </>
                    ) : installPending ? (
                        /* State 2: OS install dialog open, waiting */
                        <div className="flex flex-col items-center gap-4 py-2 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                                EA
                            </div>
                            <DialogTitle>Installing…</DialogTitle>
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <DialogDescription className="text-sm">
                                Follow the prompt to add Event App to your home screen.
                            </DialogDescription>
                        </div>
                    ) : (
                        /* State 1: offer to install */
                        <>
                            <button
                                onClick={dismissInstall}
                                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                                aria-label="Close"
                            >
                                <HugeiconsIcon icon={Cancel01Icon} size={18} />
                            </button>

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
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Update dialog ────────────────────────────────────────────── */}
            <Dialog open={needsUpdate} onOpenChange={(open) => !open && dismissUpdate()}>
                <DialogContent className="max-w-xs">
                    <button
                        onClick={dismissUpdate}
                        className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
                        aria-label="Close"
                    >
                        <HugeiconsIcon icon={Cancel01Icon} size={18} />
                    </button>

                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
                            EA
                        </div>
                        <div>
                            <DialogTitle>Update Available</DialogTitle>
                            <p className="text-xs text-muted-foreground">New version ready</p>
                        </div>
                    </div>

                    <DialogDescription className="mb-5 text-sm leading-relaxed">
                        A new version of the app is ready. Reload to get the latest features and fixes.
                    </DialogDescription>

                    <div className="flex flex-col gap-2">
                        <Button className="w-full" onClick={applyUpdate}>
                            Reload
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={dismissUpdate}>
                            Later
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

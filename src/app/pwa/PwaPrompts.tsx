import { usePwaLifecycle } from "./use-pwa-lifecycle"
import { Button } from "@/shared/ui/button"

/**
 * Renders two non-blocking prompts:
 * 1. Install banner — shown when browser fires `beforeinstallprompt`
 * 2. Update toast — shown when a new SW version is waiting
 * Both are dismissible and do not block any interaction.
 */
export function PwaPrompts() {
    const { isInstallable, installPrompt, needsUpdate, applyUpdate } = usePwaLifecycle()

    return (
        <>
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

            {isInstallable && !needsUpdate && (
                <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border bg-background px-4 py-2.5 shadow-lg">
                    <span className="text-sm">Add to Home Screen</span>
                    <Button size="sm" className="h-7 text-xs" onClick={installPrompt}>
                        Install
                    </Button>
                </div>
            )}
        </>
    )
}

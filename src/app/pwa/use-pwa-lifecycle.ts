import { useEffect, useState } from "react"
import { useRegisterSW } from "virtual:pwa-register/react"

/**
 * Manages PWA install prompt (A2HS) and SW update flow.
 * - installPrompt: call to trigger the OS install dialog
 * - isInstallable: true when `beforeinstallprompt` fired
 * - needsUpdate: true when a new SW version is waiting
 * - applyUpdate: reloads the page to activate the new SW
 */
export function usePwaLifecycle() {
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
    // Session-only: true after user clicks "Later". Resets on tab close/reload.
    const [installDismissed, setInstallDismissed] = useState(false)
    const [updateDismissed, setUpdateDismissed] = useState(false)

    // Capture the browser's install prompt event
    useEffect(() => {
        function onInstallPrompt(e: Event) {
            e.preventDefault()
            setInstallEvent(e as BeforeInstallPromptEvent)
        }
        window.addEventListener("beforeinstallprompt", onInstallPrompt)
        return () => window.removeEventListener("beforeinstallprompt", onInstallPrompt)
    }, [])

    async function installPrompt() {
        if (!installEvent) return
        await installEvent.prompt()
        setInstallEvent(null)
    }

    function dismissInstall() {
        setInstallDismissed(true)
    }

    function dismissUpdate() {
        setUpdateDismissed(true)
    }

    // SW update flow: prompt = user decides when to apply
    const {
        needRefresh: [needsUpdate],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            if (r) setInterval(() => r.update(), 60_000)
        },
    })

    function applyUpdate() {
        updateServiceWorker(true)
    }

    return {
        isInstallable: installEvent !== null && !installDismissed,
        installPrompt,
        dismissInstall,
        needsUpdate: needsUpdate && !updateDismissed,
        applyUpdate,
        dismissUpdate,
    }
}

// Browser type augmentation — not in lib.dom.d.ts yet
interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

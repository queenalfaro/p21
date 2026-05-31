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
    const [installPending, setInstallPending] = useState(false)
    const [installAccepted, setInstallAccepted] = useState(false)
    const [updateDismissed, setUpdateDismissed] = useState(false)

    // Capture the browser's install prompt event
    useEffect(() => {
        function onInstallPrompt(e: Event) {
            e.preventDefault()
            setInstallEvent(e as BeforeInstallPromptEvent)
        }
        // appinstalled fires when OS finishes — switch to success state
        function onAppInstalled() {
            setInstallPending(false)
            setInstallAccepted(true)
            setInstallEvent(null)
        }
        window.addEventListener("beforeinstallprompt", onInstallPrompt)
        window.addEventListener("appinstalled", onAppInstalled)
        return () => {
            window.removeEventListener("beforeinstallprompt", onInstallPrompt)
            window.removeEventListener("appinstalled", onAppInstalled)
        }
    }, [])

    async function installPrompt() {
        if (!installEvent) return
        setInstallPending(true)
        installEvent.prompt()
        const { outcome } = await installEvent.userChoice
        setInstallPending(false)
        if (outcome !== "accepted") {
            setInstallEvent(null)
        }
        // if accepted: appinstalled will fire and set installAccepted = true
    }

    function dismissInstall() {
        setInstallDismissed(true)
        setInstallPending(false)
        setInstallAccepted(false)
    }

    function acknowledgeInstall() {
        setInstallEvent(null)
        setInstallAccepted(false)
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
        installPending,
        installAccepted,
        installPrompt,
        dismissInstall,
        acknowledgeInstall,
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

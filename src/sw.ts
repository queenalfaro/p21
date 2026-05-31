/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core"
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"
import { registerRoute, NavigationRoute } from "workbox-routing"
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-strategies"
import { BackgroundSyncPlugin } from "workbox-background-sync"

declare const self: ServiceWorkerGlobalScope & {
    __WB_MANIFEST: Array<{ revision: string | null; url: string }>
}

// Immediately claim clients so the SW controls the page without a reload
clientsClaim()

// Skip waiting when the app explicitly requests it (update flow)
self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        self.skipWaiting()
    }
})

// ── Precache (app shell) ───────────────────────────────────────────────────────

// __WB_MANIFEST is injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// ── Guards ─────────────────────────────────────────────────────────────────────

// Never touch Vite dev-server internal paths (would break HMR if SW is enabled in dev)
function isViteInternal(url: URL): boolean {
    return (
        url.pathname.startsWith("/node_modules/.vite/") ||
        url.pathname.startsWith("/@") ||
        url.searchParams.has("v") && url.hostname === "localhost"
    )
}

// ── Navigation (SPA fallback) ──────────────────────────────────────────────────

registerRoute(
    new NavigationRoute(
        new NetworkFirst({
            cacheName: "navigation-cache",
            networkTimeoutSeconds: 3,
        }),
    ),
)

// ── Runtime caching ───────────────────────────────────────────────────────────

// Static assets: fonts, images
registerRoute(
    ({ request, url }) =>
        !isViteInternal(url) &&
        (request.destination === "font" || request.destination === "image"),
    new CacheFirst({
        cacheName: "static-assets",
        plugins: [],
    }),
)

// Supabase REST API: NetworkFirst with offline fallback
registerRoute(
    ({ url }) => url.hostname.includes("supabase.co"),
    new NetworkFirst({
        cacheName: "supabase-api",
        networkTimeoutSeconds: 5,
    }),
)

// App JS/CSS chunks — skip Vite dev-server paths
registerRoute(
    ({ request, url }) =>
        !isViteInternal(url) &&
        (request.destination === "script" || request.destination === "style"),
    new StaleWhileRevalidate({
        cacheName: "app-chunks",
    }),
)

// ── Background sync (offline message queue) ───────────────────────────────────

// Queues failed POST /messages requests and replays them when back online
const messageSyncPlugin = new BackgroundSyncPlugin("messages-queue", {
    maxRetentionTime: 24 * 60, // 24 hours in minutes
})

registerRoute(
    ({ url, request }) =>
        url.hostname.includes("supabase.co") &&
        url.pathname.includes("/rest/v1/messages") &&
        request.method === "POST",
    new NetworkFirst({
        cacheName: "messages-sync",
        plugins: [messageSyncPlugin],
        networkTimeoutSeconds: 5,
    }),
    "POST",
)

// ── Push notification seam (FCM — full implementation deferred) ────────────────

self.addEventListener("push", (event) => {
    const data: { title?: string; body?: string; url?: string } = event.data?.json() ?? {}
    const title = data.title ?? "Event"
    const options: NotificationOptions = {
        body: data.body ?? "",
        icon: "/icons/icon-192.svg",
        badge: "/icons/icon-192.svg",
        data: { url: data.url ?? "/" },
    }
    event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
    event.notification.close()
    const url: string = (event.notification.data as { url?: string })?.url ?? "/"
    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                const existing = clientList.find((c) => c.url === url && "focus" in c)
                if (existing) return existing.focus()
                return self.clients.openWindow(url)
            }),
    )
})
